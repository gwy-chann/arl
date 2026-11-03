# Quickstart & Verification Guide: Modal Dialog Root, Confirmations & Toast Notifications

**Feature Key**: `ARL-5`  
**Feature Slug**: `004-modal-dialog-toast-system`  

---

## 1. Quick Verification Commands

From the worktree root (`.worktrees/ARL-5`):

```bash
# 1. Run unit test suite
npm test

# 2. Run TypeScript compilation check
npx tsc --noEmit

# 3. Run ESLint verification
npm run lint

# 4. Start local development server
npm run dev
```

---

## 2. Interactive Browser Walkthrough Scenarios

Navigate to `http://localhost:3000/settings/appearance` (or `/dashboard`):

### Scenario 1: Destructive Action Confirmation Dialog
1. Under the Modal & Feedback Showcase section, click **"Delete Product (Demo)"**.
2. **Observe**: The modal card mounts into `#modal-root` with dimmed background overlay (`rgba(20, 22, 19, 0.45)`).
3. **Focus Verification**: Press `Tab` and `Shift+Tab`. Notice focus is strictly trapped between "Cancel" and "Delete product".
4. Click **"Cancel"**: The modal immediately closes with zero mutations.
5. Open the modal again, and click **"Delete product"**:
   - The confirmation action fires.
   - The modal closes cleanly.
   - A success toast appears with affirmative text: `"Product deleted"`.

### Scenario 2: Modal Backdrop & Escape Key Dismissal
1. Click **"Open Custom Modal (Demo)"**.
2. Press the **Escape** key on your keyboard.
   - **Observe**: The modal immediately closes, and focus returns cleanly to the button that triggered it.
3. Open the modal again, and click on the **dimmed backdrop overlay** outside the dialog card.
   - **Observe**: The modal closes immediately, leaving page state intact.

### Scenario 3: Toast Notification Auto-Dismissal (2.8 Seconds)
1. Click **"Trigger Success Toast"** (e.g. "Category saved").
2. **Observe**: The toast pill renders in the `#toasts` container with a checkmark icon.
3. Keep watch for exactly **2.8 seconds** (`2800ms`).
4. **Observe**: The toast automatically fades out and unmounts from the DOM.

### Scenario 4: Non-Blocking Stacked Notifications
1. Rapidly click **"Trigger Rapid Toasts (x3)"**.
2. **Observe**: 3 toasts render in the bottom-right corner, cleanly stacked vertically with spacing.
3. While the toasts are visible, click interactive controls on the page (e.g., theme toggle or buttons).
4. **Observe**: Controls are completely clickable and responsive (`pointer-events-none` on container, `pointer-events-auto` on toast pills).
5. Each toast unmounts smoothly as its respective 2.8s timer expires.
