# ARLQ Food Condiments Trading
## Inventory Monitoring and Sales System: Feature List

Source: Group 5 ITPM Project Scope Statement

---

## Products and Variants

3 products, each with 3 sizes = **9 sellable items**

| Product | 350 ml | 1 liter | 1 gallon |
|------|---|---|---|
| Toyo | Toyo 350 ml | Toyo 1 L | Toyo 1 gal |
| Suka | Suka 350 ml | Suka 1 L | Suka 1 gal |
| Patis | Patis 350 ml | Patis 1 L | Patis 1 gal |

Each variant has its own cost price, selling price, stock quantity, and minimum stock level.

---

## 1. Authentication
- Admin login
- Admin logout
- Change password
- Admin-only access (no customer login, no multi-role access)

## 2. Dashboard
- Sales summary
- Inventory summary (stock overview of all 9 variants)
- Low stock alerts at a glance
- Notifications panel on the landing page: overdue balances (utang unpaid for 1 week or more) and low stock alerts
- Accessible on desktop and mobile browsers

## 3. Product and Category Management
- Add, edit, search, and delete products (Toyo, Suka, Patis)
- Manage size variants per product (350 ml, 1 L, 1 gal)
- Add, edit, search, and delete categories
- Cost price and selling price per variant (used for profit computation)
- Minimum stock level per variant

## 4. Customer Management
- Add, edit, and view customer records
- Customer transaction history
- Identify customers with outstanding balances (utang)
- "Overdue" badge and days outstanding for balances unpaid after 1 week

## 5. Inventory Management
- Stock In transactions
- Stock Out transactions
- Real-time stock levels per variant
- Automatic deduction when a sale is saved
- Low stock monitoring (flags variants that reach the minimum level)
- Low stock alerts

## 6. Sales Recording
- Select customer, product, size, and quantity
- Multiple line items per sale
- Unit price auto-fills based on the selected size
- Automatic computation of total amount, remaining stock, and profit
- Record and manage sales transactions

## 7. Payment Management
- Manual payment status: **Paid**, **Partially Paid**, **Not Yet Paid**
- Amount paid field for partial payments
- Automatic remaining balance computation

## 8. Order Status Management
- Manual order status: **Pending**, **Delivered**, **Picked Up**
- Updated by the admin after the transaction is completed

## 9. Receipt Generation and Printing
- Printable receipt containing:
  - Receipt number
  - Date
  - Customer name
  - Products purchased (product and size, e.g. "Toyo - 1 L")
  - Quantity
  - Total amount
  - Amount paid
  - Remaining balance (if any)
  - Payment status

## 10. Outstanding Balance (Utang) Reminders
- Tracks transactions with payment status **Not Yet Paid** or **Partially Paid**
- Automatic check of unpaid balances
- **SMS notification to the administrator** if a balance is still unpaid after **1 week (7 days)**
- Number of days is admin-configurable (default: 7 days)
- SMS includes customer name, remaining balance, and receipt number or transaction date
- Reminder is sent to the **administrator only**, not to customers
- Reminder stops once the payment status is changed to **Paid**
- **SMS is the only notification channel** (no email)
- Notifications are also displayed on the **Dashboard landing page** (notification panel on login)
- Overdue balances are flagged on the Dashboard and the Customers with Balances list

## 11. Reports
- Daily, weekly, and monthly sales reports
- Inventory report
- Stock movement report
- Low stock report
- Customer balances report
- Earnings/profit report (based on product cost and selling price)
- Filterable by product and size

## 12. Settings (suggested)
- Reminder days configuration (default: 7 days)
- Admin mobile number for SMS reminders
- Minimum stock levels
- Notification channel: SMS only

## 13. Supporting Deliverables (not screens)
- Database design
- System documentation

---

## Out of Scope
- Online ordering
- Online payment integration
- Barcode scanning
- GPS or real-time delivery tracking
- Accounting and payroll features
- Employee management
- Customer accounts or customer login
- Supplier management
- Purchase order management
- Multi-role user access

---

## Notes
- The scope lists only Delivered and Picked Up as order statuses, but the deliverables also include Pending. All three are included here.
- The Customer Balances report appears in the To-Be process but not in the scope's report list. It is included here because balance tracking depends on it.
- The scope statement says "SMS or email" for reminders. This feature list narrows it to SMS only, with notifications also shown on the Dashboard landing page.
- The Settings module is a suggestion to support configurable reminders and minimum stock levels.
