# Quickstart & Verification Guide: Multi-Dimensional Tabbed Reporting Suite

**Feature Key**: `ARL-20`  
**Feature Slug**: `013-tabbed-reporting-suite`  

---

## 1. Quick Verification Steps

### Step 1: Automated Unit & Domain Tests
Run the test suite verifying mathematical aggregation algorithms, filtering, weighted margin calculation, and CSV generation:

```bash
npm test
```

### Step 2: Interactive Browser Verification
1. Start development server:
   ```bash
   npm run dev
   ```
2. Navigate to `http://localhost:3000/reports`
   - Should immediately redirect to `http://localhost:3000/reports/sales`.
   - Verify all 6 tabs are present: **Sales**, **Inventory**, **Stock movement**, **Low stock**, **Customer balances**, **Earnings and profit**.
3. **Scenario 1: Earnings & profit margin breakdown (`/reports/profit`)**:
   - Click "Earnings and profit" tab.
   - Verify each row displays: Product, Size, Sold, Revenue, Cost, Profit, Margin %.
   - Verify footer displays: Total units sold, Total Revenue, Total Cost, Total Profit, and accurate weighted Margin %.
   - Select Range "Last 7 days", "Last 30 days", "Last 90 days" and observe instant reactive recalculation.
4. **Scenario 2: Dynamic filter toolbar slicing (`/reports/sales`)**:
   - Return to "Sales" tab.
   - Select Period "Monthly (last 3 months)".
   - Select Product "Toyo" (Soy sauce).
   - Observe the table immediately update with 3 monthly buckets filtering for Toyo sales only.
5. **Scenario 3: Inventory valuation (`/reports/inventory`)**:
   - Click "Inventory" tab.
   - Verify columns: Product, Size, In stock, Minimum, Value at cost (`stock * cost`), Value at selling price (`stock * price`), Status.
   - Verify footer summarizes warehouse valuation totals.
6. **Scenario 4: Print report**:
   - Click "Print report" button on any tab.
   - Verify print dialog appears.
   - In print preview, confirm the sidebar, top navigation, breadcrumbs, tabs bar, and toolbar buttons are completely hidden.
7. **Scenario 5: CSV export**:
   - Click "Export CSV" on any tab.
   - Verify browser initiates download of `.csv` file.
   - Open downloaded file in text editor or Excel to confirm headers, formatted numerical values, and totals row.
