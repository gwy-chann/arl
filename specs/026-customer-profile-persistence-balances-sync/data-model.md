# Domain & Data Models: Customer Profile Persistence & Real-Time Balances Cache Invalidation

**Feature Key**: `ARL-37`  
**Feature Slug**: `026-customer-profile-persistence-balances-sync`  
**Jira Story**: STORY-4.4: Customer Profile Persistence & Real-Time Balances Cache Invalidation  
**Epic**: `EPIC-4: Analytics, Dashboard & Reporting` (`ARL-17`)  

---

## 1. PostgreSQL Schema & Privilege Model

```mermaid
erDiagram
    PUBLIC_SCHEMA ||--o{ CUSTOMERS : contains
    PUBLIC_SCHEMA ||--o{ SALES : contains
    PUBLIC_SCHEMA ||--o{ SALE_ITEMS : contains
    PUBLIC_SCHEMA ||--o{ PRODUCTS : contains
    PUBLIC_SCHEMA ||--o{ PRODUCT_VARIANTS : contains
    PUBLIC_SCHEMA ||--o{ CATEGORIES : contains
    PUBLIC_SCHEMA ||--o{ STOCK_MOVEMENTS : contains
    PUBLIC_SCHEMA ||--o{ SYSTEM_SETTINGS : contains

    ROLES ||--o{ PRIVILEGES : granted
    ROLES {
        string anon "Storefront & unauthenticated client"
        string authenticated "Staff & Admin users"
        string service_role "Background worker & Cron"
    }

    CUSTOMERS ||--o{ SALES : has
    CUSTOMERS {
        uuid id PK
        text name
        text phone
        text address
        timestamp created_at
        timestamp updated_at
    }

    SALES {
        uuid id PK
        string receipt_number
        uuid customer_id FK
        numeric total_amount
        numeric amount_paid
        text payment_status
        text order_status
        timestamp created_at
        timestamp updated_at
    }
```

---

## 2. Invalidation Event & Route Invalidation Mapping

| Event / Mutation | Originating Server Action | Target Routes Invalidated | Justification |
| :--- | :--- | :--- | :--- |
| **Customer Created** | `createCustomerAction(input)` | `/customers`<br>`/customers/${id}`<br>`/customers/balances`<br>`/reports/balances`<br>`/dashboard` | Adds customer to directory; refreshes stats and balances cache |
| **Customer Updated** | `updateCustomerAction(id, input)` | `/customers`<br>`/customers/${id}`<br>`/customers/balances`<br>`/reports/balances`<br>`/dashboard` | Updates phone/name across directory, utang tracker, and reports |
| **New Sale Registered** | `submitNewSale(input)` | `/sales`<br>`/sales/new`<br>`/inventory`<br>`/customers`<br>`/customers/balances`<br>`/reports/balances`<br>`/dashboard` | Creates debt balance if unpaid/partial; updates debtor list on Utang Tracker |
| **Sale Payment Updated** | `updateSalePaymentAction(input)` | `/sales`<br>`/sales/${saleId}`<br>`/customers`<br>`/customers/balances`<br>`/reports/balances`<br>`/dashboard` | Decreases debt balance; removes debtor from Utang Tracker if fully settled |
| **SMS Reminder Sent** | `sendCustomerSmsReminderAction(input)` | `/sales/${saleId}`<br>`/customers/balances`<br>`/dashboard` | Updates last contact / cooldown state on debtor row |

---

## 3. Utang Filter State Transitions

```mermaid
stateDiagram-v2
    [*] --> NewCustomer: Customer Created (Balance ₱0)
    NewCustomer --> CustomerDirectory: Listed in /customers
    NewCustomer --> NotInBalances: Omitted from /customers/balances

    NotInBalances --> Indebted: Credit Sale Created (Balance > ₱0)
    Indebted --> ActiveDebtor: Immediately added to /customers/balances

    ActiveDebtor --> PartiallyPaid: Partial Payment Recorded (Balance > ₱0)
    PartiallyPaid --> ActiveDebtor: Updated remaining balance displayed

    ActiveDebtor --> FullyPaid: Full Payment Recorded (Balance = ₱0)
    PartiallyPaid --> FullyPaid: Final Payment (Balance = ₱0)

    FullyPaid --> NotInBalances: Removed from /customers/balances
    FullyPaid --> CustomerDirectory: Persists in /customers permanently
```
