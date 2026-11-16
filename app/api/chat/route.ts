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

// Re-export ARLQ_SYSTEM_INSTRUCTION for top-level consumers and tests
export { ARLQ_SYSTEM_INSTRUCTION };

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

  // Low stock / inventory check
  if (
    query.includes('low') ||
    query.includes('stock') ||
    query.includes('inventory') ||
    query.includes('how many') ||
    query.includes('how much') ||
    query.includes('price')
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
            `${i.productName} ${i.size} (${i.stockQuantity} remaining, minimum ${i.minStockLevel})`
        )
        .join(', ');
      return {
        content: `The following items are currently low on stock: ${itemDescriptions}.`,
        toolCalls: executedTools,
      };
    }

    const itemDescriptions = data.items
      .map(
        (i) =>
          `${i.productName} ${i.size} is priced at ${i.formattedSellingPrice} with ${i.stockQuantity} units in stock`
      )
      .join('; ');
    return {
      content: `Current stock and pricing: ${itemDescriptions}.`,
      toolCalls: executedTools,
    };
  }

  // Sales / revenue
  if (
    query.includes('sale') ||
    query.includes('revenue') ||
    query.includes('today') ||
    query.includes('yesterday') ||
    query.includes('collected')
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
      content: `Sales summary for ${data.timeframe}: ${data.totalSalesCount} transactions recorded totaling ${data.formattedGrossRevenue} gross revenue (${data.formattedCashCollected} cash collected, ${data.formattedOutstandingBalance} outstanding balance).`,
      toolCalls: executedTools,
    };
  }

  // Utang / Debt / Overdue
  if (
    query.includes('utang') ||
    query.includes('debt') ||
    query.includes('overdue') ||
    query.includes('balance') ||
    query.includes('customer') ||
    query.includes('who')
  ) {
    executedTools.push('getCustomerBalances');
    const overdueOnly = query.includes('overdue');
    const data = (await executeToolCall(
      'getCustomerBalances',
      { overdueOnly },
      client
    )) as CustomerBalancesResult;

    if (data.customers.length === 0) {
      return {
        content: overdueOnly
          ? 'There are currently no customers with overdue balances past the reminder threshold.'
          : 'There are currently no customers with outstanding debt balances.',
        toolCalls: executedTools,
      };
    }

    const customerDetails = data.customers
      .map(
        (c) =>
          `${c.name}: ${c.formattedTotalBalance} (${c.oldestUnpaidDays} days unpaid${
            c.isOverdue ? ', overdue' : ''
          })`
      )
      .join('; ');

    return {
      content: `Total outstanding debt is ${data.formattedOutstandingDebt} across ${data.totalIndebtedCustomers} customer(s): ${customerDetails}.`,
      toolCalls: executedTools,
    };
  }

  // Store settings
  if (
    query.includes('setting') ||
    query.includes('threshold') ||
    query.includes('sms') ||
    query.includes('policy')
  ) {
    executedTools.push('getStoreSettings');
    const data = (await executeToolCall(
      'getStoreSettings',
      {},
      client
    )) as StoreSettingsResult;
    return {
      content: `Store configuration for ${data.storeName}: Overdue reminder limit is set to ${
        data.overdueReminderDays
      } days, notification mobile is ${data.reminderPhone}, and SMS alerts are ${
        data.smsNotificationEnabled ? 'enabled' : 'disabled'
      }.`,
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

    if (!apiKey) {
      // Execute offline grounded response generator
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

    // Convert conversation to Gemini format
    const contents: GeminiContent[] = messages.map((m) => ({
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

      const res = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: ARLQ_SYSTEM_INSTRUCTION }],
          },
          tools,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Gemini API Error:', errorText);
        // Fall back gracefully to offline grounding
        const fallback = await generateOfflineGroundedResponse(
          latestUserMessage,
          supabase
        );
        return Response.json({
          role: 'assistant',
          content: stripEmojis(fallback.content),
          toolCallsExecuted: fallback.toolCalls,
        });
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

    // If loop count exceeded, return fallback
    const fallback = await generateOfflineGroundedResponse(
      latestUserMessage,
      supabase
    );
    return Response.json({
      role: 'assistant',
      content: stripEmojis(fallback.content),
      toolCallsExecuted: fallback.toolCalls,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Chat endpoint error:', error);
    return Response.json(
      { error: 'Internal assistant error', message },
      { status: 500 }
    );
  }
}
