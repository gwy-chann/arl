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

const CUSTOMER_KEYWORDS = [
  'utang',
  'debt',
  'overdue',
  'balance',
  'owe',
  'owing',
  'credit',
  'customer',
  'nena',
  'jun',
  'tonyo',
  'lechon',
];

const SALES_KEYWORDS = ['sale', 'revenue', 'collected', 'transaction', 'income'];
const TIME_KEYWORDS = ['today', 'yesterday', 'week', 'month'];
const METRIC_KEYWORDS = ['how much', 'total', 'made', 'earned'];

const SETTINGS_KEYWORDS = [
  'setting',
  'threshold',
  'sms',
  'policy',
  'phone',
  'reminder',
];

const INVENTORY_KEYWORDS = [
  'low',
  'stock',
  'inventory',
  'price',
  'pricing',
  'cost',
  'toyo',
  'suka',
  'patis',
  'bottle',
  'variant',
  'how many',
  'how much',
];

function isCustomerQuery(query: string): boolean {
  return (
    CUSTOMER_KEYWORDS.some((kw) => query.includes(kw)) ||
    (query.includes('who') && (query.includes('pay') || query.includes('unpaid')))
  );
}

function isSalesQuery(query: string): boolean {
  if (SALES_KEYWORDS.some((kw) => query.includes(kw))) {
    return true;
  }
  return (
    TIME_KEYWORDS.some((kw) => query.includes(kw)) &&
    METRIC_KEYWORDS.some((kw) => query.includes(kw))
  );
}

function isSettingsQuery(query: string): boolean {
  return SETTINGS_KEYWORDS.some((kw) => query.includes(kw));
}

function isInventoryQuery(query: string): boolean {
  return INVENTORY_KEYWORDS.some((kw) => query.includes(kw));
}

function detectCustomerName(query: string): string | undefined {
  if (query.includes('nena')) return 'Nena';
  if (query.includes('jun')) return 'Jun-Jun';
  if (query.includes('tonyo')) return 'Tonyo';
  if (query.includes('boy') || query.includes('lechon')) return 'Tito Boy';
  return undefined;
}

function resolveSalesTimeframe(query: string): string {
  if (query.includes('yesterday')) {
    return 'yesterday';
  }
  if (query.includes('week') || query.includes('7 days')) {
    return 'last_7_days';
  }
  if (query.includes('month')) {
    return 'current_month';
  }
  return 'today';
}

function detectCondiment(query: string): string | undefined {
  if (query.includes('toyo')) return 'Toyo';
  if (query.includes('suka')) return 'Suka';
  if (query.includes('patis')) return 'Patis';
  return undefined;
}

function formatCustomerItem(c: CustomerBalancesResult['customers'][number]): string {
  const overdueLabel = c.isOverdue ? ', overdue' : '';
  return `• ${c.name}: ${c.formattedTotalBalance} (${c.oldestUnpaidDays} days unpaid${overdueLabel})`;
}

function getEmptyCustomerBalancesMessage(
  searchCustomer?: string,
  overdueOnly?: boolean
): string {
  if (searchCustomer) {
    return `No customer records matching "${searchCustomer}" currently have an outstanding debt or unpaid balance.`;
  }
  if (overdueOnly) {
    return 'There are currently no customers with overdue balances past the reminder threshold.';
  }
  return 'There are currently no customers with outstanding debt balances.';
}

async function handleCustomerBalancesQuery(
  query: string,
  client?: SupabaseClient | null
): Promise<{ content: string; toolCalls: string[] }> {
  const executedTools = ['getCustomerBalances'];
  const overdueOnly = query.includes('overdue');
  const searchCustomer = detectCustomerName(query);

  const data = (await executeToolCall(
    'getCustomerBalances',
    { overdueOnly, customerName: searchCustomer },
    client
  )) as CustomerBalancesResult;

  if (data.customers.length === 0) {
    return {
      content: getEmptyCustomerBalancesMessage(searchCustomer, overdueOnly),
      toolCalls: executedTools,
    };
  }

  if (searchCustomer && data.customers.length === 1) {
    const c = data.customers[0];
    const overdueLabel = c.isOverdue ? ', overdue' : '';
    return {
      content: `${c.name} currently has an outstanding balance of ${c.formattedTotalBalance} (${c.oldestUnpaidDays} days unpaid${overdueLabel}).`,
      toolCalls: executedTools,
    };
  }

  const customerDetails = data.customers.map(formatCustomerItem).join('\n');
  const content = searchCustomer
    ? `Found ${data.customers.length} customer account(s) matching "${searchCustomer}":\n${customerDetails}`
    : `Total outstanding debt is ${data.formattedOutstandingDebt} across ${data.totalIndebtedCustomers} customer(s):\n${customerDetails}`;

  return { content, toolCalls: executedTools };
}

async function handleSalesQuery(
  query: string,
  client?: SupabaseClient | null
): Promise<{ content: string; toolCalls: string[] }> {
  const timeframe = resolveSalesTimeframe(query);
  const data = (await executeToolCall(
    'getSalesOverview',
    { timeframe },
    client
  )) as SalesOverviewResult;

  return {
    content: `Sales summary for ${data.timeframe}:\n• Transactions: ${data.totalSalesCount} recorded\n• Gross Revenue: ${data.formattedGrossRevenue}\n• Cash Collected: ${data.formattedCashCollected}\n• Outstanding Balance: ${data.formattedOutstandingBalance}`,
    toolCalls: ['getSalesOverview'],
  };
}

async function handleSettingsQuery(
  client?: SupabaseClient | null
): Promise<{ content: string; toolCalls: string[] }> {
  const data = (await executeToolCall(
    'getStoreSettings',
    {},
    client
  )) as StoreSettingsResult;

  const smsStatus = data.smsNotificationEnabled ? 'Enabled' : 'Disabled';
  return {
    content: `Store configuration for ${data.storeName}:\n• Overdue Reminder Limit: ${data.overdueReminderDays} days\n• Notification Mobile: ${data.reminderPhone}\n• SMS Alerts: ${smsStatus}`,
    toolCalls: ['getStoreSettings'],
  };
}

function getEmptyInventoryMessage(
  searchCondiment?: string,
  isLowOnly?: boolean
): string {
  if (searchCondiment) {
    return `No ${searchCondiment} items were found in the current store catalog. ARLQ carries Toyo, Suka, and Patis in 350 ml, 1 L, and 1 gal packaging.`;
  }
  if (isLowOnly) {
    return 'There are currently no items below their minimum stock threshold.';
  }
  return 'No matching condiment items were found in the inventory.';
}

function formatInventoryStock(items: InventorySummaryResult['items'], isLowOnly: boolean): string {
  if (isLowOnly) {
    return items
      .map(
        (i) =>
          `• ${i.productName} ${i.size} (${i.stockQuantity} remaining, minimum ${i.minStockLevel})`
      )
      .join('\n');
  }
  return items
    .map(
      (i) =>
        `• ${i.productName} ${i.size}: ${i.formattedSellingPrice} (${i.stockQuantity} in stock)`
    )
    .join('\n');
}

async function handleInventoryQuery(
  query: string,
  client?: SupabaseClient | null
): Promise<{ content: string; toolCalls: string[] }> {
  const executedTools = ['getInventorySummary'];
  const isLowOnly =
    query.includes('low') || query.includes('reorder') || query.includes('threshold');
  const searchCondiment = detectCondiment(query);

  const data = (await executeToolCall(
    'getInventorySummary',
    {
      lowStockOnly: isLowOnly,
      searchQuery: searchCondiment,
    },
    client
  )) as InventorySummaryResult;

  if (data.items.length === 0) {
    return {
      content: getEmptyInventoryMessage(searchCondiment, isLowOnly),
      toolCalls: executedTools,
    };
  }

  const itemDescriptions = formatInventoryStock(data.items, isLowOnly);
  if (isLowOnly) {
    return {
      content: `The following items are currently low on stock:\n${itemDescriptions}`,
      toolCalls: executedTools,
    };
  }

  return {
    content: searchCondiment
      ? `Current stock and pricing for ${searchCondiment}:\n${itemDescriptions}`
      : `Current stock and pricing:\n${itemDescriptions}`,
    toolCalls: executedTools,
  };
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

  if (isCustomerQuery(query)) {
    return handleCustomerBalancesQuery(query, client);
  }
  if (isSalesQuery(query)) {
    return handleSalesQuery(query, client);
  }
  if (isSettingsQuery(query)) {
    return handleSettingsQuery(client);
  }
  if (isInventoryQuery(query)) {
    return handleInventoryQuery(query, client);
  }

  return {
    content:
      'I can assist you with live store information. You can ask about current inventory levels, low-stock alerts, daily sales revenue, customer utang balances, or store settings.',
    toolCalls: [],
  };
}

async function resolveSupabaseClient(): Promise<SupabaseClient | null> {
  try {
    const { getSafeSupabaseClient } = await import(
      '../../../lib/supabase/server.ts'
    );
    return await getSafeSupabaseClient();
  } catch {
    return null;
  }
}

async function callGeminiApi(
  geminiUrl: string,
  contents: GeminiContent[]
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    return await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: ARLQ_SYSTEM_INSTRUCTION }],
        },
        tools: [{ functionDeclarations: ASSISTANT_TOOL_DECLARATIONS }],
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function safelyExecuteTool(
  name: string,
  args: Record<string, unknown>,
  supabase: SupabaseClient | null
): Promise<unknown> {
  try {
    return await executeToolCall(name as AssistantToolName, args, supabase);
  } catch (toolErr: unknown) {
    const errMessage =
      toolErr instanceof Error ? toolErr.message : 'Error executing tool';
    return { error: errMessage };
  }
}

async function executeGeminiChatLoop(
  apiKey: string,
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  supabase: SupabaseClient | null
): Promise<Response> {
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const prunedMessages = pruneConversationHistory(messages, 6);
  const contents: GeminiContent[] = prunedMessages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));

  const executedTools: string[] = [];
  const maxLoops = 5;

  for (let loopCount = 0; loopCount < maxLoops; loopCount++) {
    const res = await callGeminiApi(geminiUrl, contents);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Gemini API Error:', res.status, errorText);
      const mapped = mapGeminiError(res.status, errorText);
      return Response.json({ error: mapped.message }, { status: mapped.status });
    }

    const responseData = (await res.json()) as GeminiApiResponse;
    const candidate = responseData.candidates?.[0];
    const modelParts = candidate?.content?.parts || [];

    const functionCallPart = modelParts.find((p) => p.functionCall);

    if (functionCallPart?.functionCall) {
      const { name, args } = functionCallPart.functionCall;
      executedTools.push(name);

      const toolResult = await safelyExecuteTool(name, args, supabase);

      contents.push(
        {
          role: 'model',
          parts: [{ functionCall: { name, args } }],
        },
        {
          role: 'function',
          parts: [
            {
              functionResponse: {
                name,
                response: { result: toolResult as Record<string, unknown> },
              },
            },
          ],
        }
      );
      continue;
    }

    const textPart = modelParts.find((p) => p.text);
    const outputText = textPart?.text || 'No response generated.';

    return Response.json({
      role: 'assistant',
      content: stripEmojis(outputText),
      toolCallsExecuted: executedTools,
    });
  }

  return Response.json({
    role: 'assistant',
    content: stripEmojis('Query processing completed.'),
    toolCallsExecuted: executedTools,
  });
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

    const supabase = await resolveSupabaseClient();
    const apiKey = process.env.GEMINI_API_KEY;
    const isOfflineSimulation = process.env.ASSISTANT_OFFLINE_MODE === 'true';

    if (!apiKey && !isOfflineSimulation) {
      return Response.json(
        { error: MISSING_API_KEY_MESSAGE },
        { status: 503 }
      );
    }

    if (!apiKey && isOfflineSimulation) {
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

    return await executeGeminiChatLoop(apiKey!, messages, supabase);
  } catch (error: unknown) {
    console.error('Chat endpoint error:', error);
    const mapped = mapGeminiError(error);
    return Response.json(
      { error: mapped.message },
      { status: mapped.status }
    );
  }
}
