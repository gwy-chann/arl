# Quickstart & Verification Guide: Curated Suggested Questions

**Feature Key**: `ARL-31`  
**Feature Slug**: `018-curated-suggested-questions`  

---

## 1. Running Automated Tests

Run the dedicated test suite for suggested questions and assistant contracts:

```bash
# Inside the worktree .worktrees/ARL-31
npm test
```

To run only the assistant test suites:
```bash
node --no-warnings=ExperimentalWarning --test --experimental-strip-types "tests/assistant-*.test.ts"
```

---

## 2. Manual Verification Workflow

### Step 1: Open the Application
1. Start development server:
   ```bash
   npm run dev
   ```
2. Navigate to `http://localhost:3000` (or `http://localhost:3000/dashboard`).
3. Click the floating "Store Assistant" launcher pill in the bottom right corner.

### Step 2: Verify Initial Suggested Questions View
1. Ensure the popover opens cleanly.
2. Confirm that 4 categories are visible:
   - **INVENTORY**: `Low stock items`, `1L Toyo stock`
   - **SALES & REVENUE**: `Today's sales`, `Best sellers`
   - **CUSTOMER CREDIT**: `Overdue utang`, `Customer balances`
   - **STORE RULES**: `Reminder rules`
3. Verify that zero emojis are rendered across all buttons and section headings.
4. Verify all colors use semantic tokens (`bg-bg-base`, `border-border`, etc.).

### Step 3: Trigger a Quick-Prompt
1. Click the `Low stock items` chip.
2. Verify:
   - The user turn bubble appears containing `"Which products are currently low on stock?"`.
   - The suggested questions container transitions out / hides immediately.
   - The assistant typing indicator animates.
   - Grounded inventory response is returned and rendered.

### Step 4: Clear Chat History & Verify Restoration
1. Click the "Clear" button in the popover header.
2. Verify:
   - Message turns are cleared.
   - The suggested questions container is immediately restored.
   - Session storage is cleared.

### Step 5: Test Universal Theme Switching
1. Toggle the application theme to Dark Mode.
2. Verify that all chip backgrounds, borders, focus rings, and typography contrast adapt properly with zero unstyled or blinding white surfaces.
