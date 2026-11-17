import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ASSISTANT_TOOL_DECLARATIONS,
  type AssistantToolName,
  type InventorySummaryResult,
  type SalesOverviewResult,
  type CustomerBalancesResult,
  type StoreSettingsResult,
} from '../../../lib/assistant/assistant-grounding-contracts.ts';
import { executeToolCall } from '../../../lib/assistant/assistant-tools.ts';
import {
  ARLQ_SYSTEM_INSTRUCTION,
  classifyQueryIntent,
  getRefusalResponseForIntent,
  stripEmojis,
} from '../../../lib/assistant/assistant-guardrails.ts';
import {
  pruneConversationHistory,
  mapGeminiError,
  MISSING_API_KEY_MESSAGE,
} from '../../../lib/assistant/assistant-resilience.ts';

// Re-export ARLQ_SYSTEM_INSTRUCTION and pruneConversationHistory for top-level consumers and tests
export { ARLQ_SYSTEM_INSTRUCTION, pruneConversationHistory };

// Message schema
const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().min(1),
      })
    )
    .min(1),
});

interface GeminiPart {
  text?: string;
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
  functionResponse?: {
    name: string;
    response: Record<string, unknown>;
  };
}

interface GeminiContent {
  role: string;
  parts: GeminiPart[];
}

interface GeminiCandidate {
  content?: {
    parts?: GeminiPart[];
  };
}

interface GeminiApiResponse {
  candidates?: GeminiCandidate[];
}

/**
 * Deterministic grounding generator when GEMINI_API_KEY is not configured (offline / local dev / mock).
 */
async function generateOfflineGroundedResponse(
  latestMessage: string,
  client?: SupabaseClient | null
): Promise<{ content: string; toolCalls: string[] }> {
  // Check guardrails first
  const intent = classifyQueryIntent(latestMessage);
  const refusal = getRefusalResponseForIntent(intent);
  if (refusal) {
    return {
      content: stripEmojis(refusal),
      toolCalls: [],
    };
  }

  const query = latestMessage.toLowerCase();
  const executedTools: string[] = [];

  // 1. Customer Utang / Debt / Overdue / Balance check
  if (
    query.includes('utang') ||
    query.includes('debt') ||
    query.includes('overdue') ||
    query.includes('balance') ||
    query.includes('owe') ||
    query.includes('owing') ||
    query.includes('credit') ||
    query.includes('customer') ||
    query.includes('nena') ||
    query.includes('jun') ||
    query.includes('tonyo') ||
    query.includes('lechon') ||
    (query.includes('who') && (query.includes('pay') || query.includes('unpaid')))
  ) {
    executedTools.push('getCustomerBalances');
    const overdueOnly = query.includes('overdue');

    // Detect if a specific customer name is queried
    let searchCustomer: string | undefined = undefined;
    if (query.includes('nena')) searchCustomer = 'Nena';
    else if (query.includes('jun')) searchCustomer = 'Jun-Jun';
    else if (query.includes('tonyo')) searchCustomer = 'Tonyo';
    else if (query.includes('boy') || query.includes('lechon')) searchCustomer = 'Tito Boy';

    const data = (await executeToolCall(
      'getCustomerBalances',
      { overdueOnly, customerName: searchCustomer },
      client
    )) as CustomerBalancesResult;

    if (data.customers.length === 0) {
      if (searchCustomer) {
        return {
          content: `No customer records matching "${searchCustomer}" currently have an outstanding debt or unpaid balance.`,
          toolCalls: executedTools,
        };
      }
      return {
        content: overdueOnly
          ? 'There are currently no customers with overdue balances past the reminder threshold.'
          : 'There are currently no customers with outstanding debt balances.',
        toolCalls: executedTools,
      };
    }

    if (searchCustomer && data.customers.length === 1) {
      const c = data.customers[0];
      return {
        content: `${c.name} currently has an outstanding balance of ${c.formattedTotalBalance} (${c.oldestUnpaidDays} days unpaid${c.isOverdue ? ', overdue' : ''}).`,
        toolCalls: executedTools,
      };
    }

    const customerDetails = data.customers
      .map(
        (c) =>
          `• ${c.name}: ${c.formattedTotalBalance} (${c.oldestUnpaidDays} days unpaid${
            c.isOverdue ? ', overdue' : ''
          })`
      )
      .join('\n');

    return {
      content: searchCustomer
        ? `Found ${data.customers.length} customer account(s) matching "${searchCustomer}":\n${customerDetails}`
        : `Total outstanding debt is ${data.formattedOutstandingDebt} across ${data.totalIndebtedCustomers} customer(s):\n${customerDetails}`,
      toolCalls: executedTools,
    };
  }

  // 2. Sales / revenue
  if (
    query.includes('sale') ||
    query.includes('revenue') ||
    query.includes('collected') ||
    query.includes('transaction') ||
    query.includes('income') ||
    ((query.includes('today') || query.includes('yesterday') || query.includes('week') || query.includes('month')) &&
      (query.includes('how much') || query.includes('total') || query.includes('made') || query.includes('earned')))
  ) {
    executedTools.push('getSalesOverview');
    const timeframe = query.includes('yesterday')
      ? 'yesterday'
      : query.includes('week') || query.includes('7 days')
      ? 'last_7_days'
      : query.includes('month')
      ? 'current_month'
      : 'today';

    const data = (await executeToolCall(
      'getSalesOverview',
      { timeframe },
      client
    )) as SalesOverviewResult;
    return {
      content: `Sales summary for ${data.timeframe}:\n• Transactions: ${data.totalSalesCount} recorded\n• Gross Revenue: ${data.formattedGrossRevenue}\n• Cash Collected: ${data.formattedCashCollected}\n• Outstanding Balance: ${data.formattedOutstandingBalance}`,
      toolCalls: executedTools,
    };
  }

  // 3. Store settings
  if (
    query.includes('setting') ||
    query.includes('threshold') ||
    query.includes('sms') ||
    query.includes('policy') ||
    query.includes('phone') ||
    query.includes('reminder')
  ) {
    executedTools.push('getStoreSettings');
    const data = (await executeToolCall(
      'getStoreSettings',
      {},
      client
    )) as StoreSettingsResult;
    return {
      content: `Store configuration for ${data.storeName}:\n• Overdue Reminder Limit: ${data.overdueReminderDays} days\n• Notification Mobile: ${data.reminderPhone}\n• SMS Alerts: ${data.smsNotificationEnabled ? 'Enabled' : 'Disabled'}`,
      toolCalls: executedTools,
    };
  }

  // 4. Low stock / inventory check
  if (
    query.includes('low') ||
    query.includes('stock') ||
    query.includes('inventory') ||
    query.includes('price') ||
    query.includes('pricing') ||
    query.includes('cost') ||
    query.includes('toyo') ||
    query.includes('suka') ||
    query.includes('patis') ||
    query.includes('bottle') ||
    query.includes('variant') ||
    query.includes('how many') ||
    query.includes('how much')
  ) {
    executedTools.push('getInventorySummary');
    const isLowOnly =
      query.includes('low') || query.includes('reorder') || query.includes('threshold');
    const searchCondiment = query.includes('toyo')
      ? 'Toyo'
      : query.includes('suka')
      ? 'Suka'
      : query.includes('patis')
      ? 'Patis'
      : undefined;

    const data = (await executeToolCall(
      'getInventorySummary',
      {
        lowStockOnly: isLowOnly,
        searchQuery: searchCondiment,
      },
      client
    )) as InventorySummaryResult;

    if (data.items.length === 0) {
      if (searchCondiment) {
        return {
          content: `No ${searchCondiment} items were found in the current store catalog. ARLQ carries Toyo, Suka, and Patis in 350 ml, 1 L, and 1 gal packaging.`,
          toolCalls: executedTools,
        };
      }
      return {
        content: isLowOnly
          ? 'There are currently no items below their minimum stock threshold.'
          : 'No matching condiment items were found in the inventory.',
        toolCalls: executedTools,
      };
    }

    if (isLowOnly) {
      const itemDescriptions = data.items
        .map(
          (i) =>
            `• ${i.productName} ${i.size} (${i.stockQuantity} remaining, minimum ${i.minStockLevel})`
        )
        .join('\n');
      return {
        content: `The following items are currently low on stock:\n${itemDescriptions}`,
        toolCalls: executedTools,
      };
    }

    const itemDescriptions = data.items
      .map(
        (i) =>
          `• ${i.productName} ${i.size}: ${i.formattedSellingPrice} (${i.stockQuantity} in stock)`
      )
      .join('\n');
    return {
      content: searchCondiment
        ? `Current stock and pricing for ${searchCondiment}:\n${itemDescriptions}`
        : `Current stock and pricing:\n${itemDescriptions}`,
      toolCalls: executedTools,
    };
  }

  return {
    content:
      'I can assist you with live store information. You can ask about current inventory levels, low-stock alerts, daily sales revenue, customer utang balances, or store settings.',
    toolCalls: executedTools,
  };
}

export async function POST(req: Request) {
  try {
    const json: unknown = await req.json();
    const parsed = ChatRequestSchema.safeParse(json);
    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid chat request payload', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { messages } = parsed.data;
    const latestUserMessage =
      [...messages].reverse().find((m) => m.role === 'user')?.content || '';

    // Pre-flight guardrail check: Intercept out-of-scope, mutation, or adversarial prompts
    const queryIntent = classifyQueryIntent(latestUserMessage);
    const refusalMessage = getRefusalResponseForIntent(queryIntent);

    if (refusalMessage) {
      return Response.json({
        role: 'assistant',
        content: stripEmojis(refusalMessage),
        toolCallsExecuted: [],
      });
    }

    let supabase: SupabaseClient | null = null;
    try {
      const { getSafeSupabaseClient } = await import(
        '../../../lib/supabase/server.ts'
      );
      supabase = await getSafeSupabaseClient();
    } catch {
      supabase = null;
    }
    const apiKey = process.env.GEMINI_API_KEY;
    const isOfflineSimulation = process.env.ASSISTANT_OFFLINE_MODE === 'true';

    if (!apiKey && !isOfflineSimulation) {
      return Response.json(
        { error: MISSING_API_KEY_MESSAGE },
        { status: 503 }
      );
    }

    if (!apiKey && isOfflineSimulation) {
      // Execute offline grounded response generator for offline simulation / local tests
      const result = await generateOfflineGroundedResponse(
        latestUserMessage,
        supabase
      );
      return Response.json({
        role: 'assistant',
        content: stripEmojis(result.content),
        toolCallsExecuted: result.toolCalls,
      });
    }

    // Call Gemini 2.0 Flash API with Tools & Multi-turn Function Calling Loop
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    // Convert pruned conversation to Gemini format (Sliding Window: last 6 turns)
    const prunedMessages = pruneConversationHistory(messages, 6);
    const contents: GeminiContent[] = prunedMessages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const tools = [
      {
        functionDeclarations: ASSISTANT_TOOL_DECLARATIONS,
      },
    ];

    let loopCount = 0;
    const maxLoops = 5;
    const executedTools: string[] = [];

    while (loopCount < maxLoops) {
      loopCount++;

      // 15-second timeout for upstream Gemini requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      let res: Response;

      try {
        res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{ text: ARLQ_SYSTEM_INSTRUCTION }],
            },
            tools,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Gemini API Error:', res.status, errorText);
        const mapped = mapGeminiError(res.status, errorText);
        return Response.json({ error: mapped.message }, { status: mapped.status });
      }

      const responseData = (await res.json()) as GeminiApiResponse;
      const candidate = responseData.candidates?.[0];
      const modelParts = candidate?.content?.parts || [];

      // Check for function calls
      const functionCallPart = modelParts.find((p) => p.functionCall);

      if (functionCallPart && functionCallPart.functionCall) {
        const { name, args } = functionCallPart.functionCall;
        executedTools.push(name);

        // Execute read-only tool
        let toolResult: unknown;
        try {
          toolResult = await executeToolCall(
            name as AssistantToolName,
            args,
            supabase
          );
        } catch (toolErr: unknown) {
          const errMessage =
            toolErr instanceof Error ? toolErr.message : 'Error executing tool';
          toolResult = { error: errMessage };
        }

        // Push model functionCall turn to history
        contents.push({
          role: 'model',
          parts: [{ functionCall: { name, args } }],
        });

        // Push functionResponse turn to history
        contents.push({
          role: 'function',
          parts: [
            {
              functionResponse: {
                name,
                response: { result: toolResult as Record<string, unknown> },
              },
            },
          ],
        });

        // Loop continues to let Gemini produce natural language grounded response
        continue;
      }

      // Final text response received
      const textPart = modelParts.find((p) => p.text);
      const outputText = textPart?.text || 'No response generated.';

      return Response.json({
        role: 'assistant',
        content: stripEmojis(outputText),
        toolCallsExecuted: executedTools,
      });
    }

    // If loop count exceeded, return fallback generic error or offline response
    return Response.json({
      role: 'assistant',
      content: stripEmojis('Query processing completed.'),
      toolCallsExecuted: executedTools,
    });
  } catch (error: unknown) {
    console.error('Chat endpoint error:', error);
    const mapped = mapGeminiError(error);
    return Response.json(
      { error: mapped.message },
      { status: mapped.status }
    );
  }
}
