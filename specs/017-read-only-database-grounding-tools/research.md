# Research & Technical Architecture: Read-Only Database Grounding Tools

**Feature Key**: `ARL-32`  
**Feature Slug**: `017-read-only-database-grounding-tools`  
**Parent Epic**: `ARL-29` (In-App AI Operational Assistant)  

---

## 1. Technical Stack Constraints

- **Framework**: Next.js 16 App Router (Node.js 20+ runtime for API routes).
- **LLM / SDK**: Google Gen AI SDK (`@google/genai` or standard REST API contracts for Gemini 2.0 Flash function calling).
- **Data Layer**: Supabase PostgreSQL (`@supabase/ssr` / `@supabase/supabase-js`) with deterministic in-memory store fallbacks (`ProductService`, `SaleService`, `CustomerService`, `getSystemSettings`).
- **Validation**: Zod for contract schemas and tool input validation.
- **Testing**: Node.js built-in test runner (`node --test --experimental-strip-types "tests/*.test.ts"`).

---

## 2. Gemini Tool Declaration Contracts

The Gemini Function Calling API expects tools declared in the following structure:

```json
{
  "functionDeclarations": [
    {
      "name": "getInventorySummary",
      "description": "Retrieves current stock levels, packaging sizes, cost/retail prices, and low-stock warnings for ARLQ condiments (Toyo, Suka, Patis).",
      "parameters": {
        "type": "OBJECT",
        "properties": {
          "searchQuery": {
            "type": "STRING",
            "description": "Optional product name or condiment to filter (e.g. 'Toyo', 'Suka', 'Patis')."
          },
          "lowStockOnly": {
            "type": "BOOLEAN",
            "description": "If true, returns only items where current stock <= minimum stock level."
          }
        }
      }
    }
  ]
}
```

The system requires four declarations:
1. `getInventorySummary`
2. `getSalesOverview`
3. `getCustomerBalances`
4. `getStoreSettings`

---

## 3. Database Query & Domain Service Mapping

### 3.1 `getInventorySummary`
- **Data Source**: `products` joined with `product_variants` and `categories` (or `ProductService.listProducts()` in-memory).
- **Filtering**:
  - `searchQuery`: case-insensitive substring match against `product.name` and `variant.size`.
  - `lowStockOnly`: `variant.stock_quantity <= variant.min_stock_level`.
- **Normalization**:
  - Normalizes variant sizes to standard labels: `'350 ml'`, `'1 L'`, `'1 gal'`.
  - Computes `isLowStock: stock_quantity <= min_stock_level`.
  - Computes `lowStockCount` and `totalVariants`.

### 3.2 `getSalesOverview`
- **Data Source**: `sales` table (or `SaleService.listSales()` in-memory).
- **Timeframe Filtering** (Asia/Manila UTC+8 boundaries):
  - `'today'`: from 00:00:00 to 23:59:59 Manila time today.
  - `'yesterday'`: from 00:00:00 to 23:59:59 Manila time yesterday.
  - `'last_7_days'`: trailing 7 full calendar days.
  - `'current_month'`: 1st of current month to end of current month.
  - `'all'`: unbounded.
- **Aggregations**:
  - `totalSalesCount`: number of matching sales.
  - `totalGrossRevenue`: sum of `total_amount`.
  - `totalCashCollected`: sum of `amount_paid`.
  - `totalOutstandingBalance`: sum of `balance`.
  - `paymentBreakdown`: counts of `paid`, `partially_paid`, and `not_paid`.

### 3.3 `getCustomerBalances`
- **Data Source**: `customers` and `sales` tables (or `CustomerService.getCustomerDirectory()` + `SaleService.listSales()` in-memory).
- **Filtering**:
  - Filter for customers with unpaid or partially paid transactions (`totalBalance > 0`).
  - `customerName`: case-insensitive partial match on customer name.
  - `overdueOnly`: only accounts where `isOverdue === true` (days unpaid >= store reminder threshold, default 7 days).
- **Computations**:
  - `oldestUnpaidDays`: max days unpaid among active open invoices for each customer.
  - `isOverdue`: `oldestUnpaidDays >= reminderThreshold`.
  - `totalOutstandingDebt`: aggregate sum across all indebted customers.

### 3.4 `getStoreSettings`
- **Data Source**: `store_settings` table (or `getSystemSettings()` in-memory).
- **Fields Returned**:
  - `overdueReminderDays` (default: 7)
  - `reminderPhone` / `adminMobile`
  - `defaultMinStockLevel`
  - `smsNotificationEnabled`
  - `storeName` ("ARLQ Store")

---

## 4. Architectural Boundaries & Security

1. **Pure Function Service Architecture**:
   - `lib/assistant/assistant-tools.ts` exports pure asynchronous query functions accepting an optional `SupabaseClient` instance.
   - When `supabase` is null or credentials are unconfigured, functions fall back seamlessly to the in-memory domain services (`ProductService`, `SaleService`, `CustomerService`, `getSystemSettings`), ensuring 100% test coverage and CI reliability without live network calls.
2. **Read-Only Rigor**:
   - Zero SQL write verbs or DDL statements.
   - No tool declarations or execution hooks for mutating operations.
3. **Execution Dispatcher**:
   - An `executeToolCall(name, args, client)` dispatcher validates inputs against Zod schemas and invokes the appropriate query function, returning serialized JSON suitable for feeding back to Gemini function responses.
