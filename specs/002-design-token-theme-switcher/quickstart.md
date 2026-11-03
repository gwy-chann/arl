# Quickstart & Verification Guide: Design Token System & Dynamic Theme Switcher

**Feature Key**: `ARL-4`  
**Feature Slug**: `002-design-token-theme-switcher`  

---

## 1. Quick Verification Commands

From the project root or `.worktrees/ARL-4`:

```bash
# 1. Run unit test suite
npm test

# 2. Run static linter
npm run lint

# 3. Run production build
npm run build

# 4. Scan for hardcoded hex values in app/ and components/
git grep -E "#[0-9a-fA-F]{3,8}" -- "app/*.tsx" "components/*.tsx"
```

---

## 2. Interactive Verification Scenarios

### Scenario 1: One-Click Topbar Toggle & Toast Verification
1. Start dev server: `npm run dev`.
2. Navigate to `http://localhost:3000/login` or `http://localhost:3000/dashboard`.
3. Locate the theme toggle button in the top right.
4. Click the toggle button.
5. **Expected Outcome**:
   - `data-theme="dark"` is set on `<html>` tag.
   - Background transitions instantly to dark obsidian canvas (`#111827`).
   - A floating toast appears at the bottom center displaying `"Dark mode enabled"`.
   - Toast automatically fades out after ~2.8 seconds.
   - Clicking again toggles back to Light mode with toast `"Light mode enabled"`.

### Scenario 2: System Default Live Sync
1. Navigate to `http://localhost:3000/settings/appearance`.
2. Select the **"System default"** card option.
3. Confirm toast displays `"Theme set to System default"`.
4. Open your OS settings (Windows Settings -> Personalization -> Colors, or macOS System Settings -> Appearance).
5. Switch OS between Dark and Light mode.
6. **Expected Outcome**: The web app dynamically updates its surfaces without reloading the page.

### Scenario 3: Zero-FOUC (Cold Boot Refresh Test)
1. Switch theme to **Dark mode**.
2. Open Chrome DevTools -> Application -> Local Storage. Confirm `arlq-theme` is set to `"dark"`.
3. Perform a hard refresh (`Ctrl + Shift + R`).
4. **Expected Outcome**: The background is obsidian dark immediately from the first rendered frame. No white or light flash is visible.

### Scenario 4: Cross-Tab Synchronization
1. Open two browser windows side by side at `http://localhost:3000/dashboard`.
2. Click the theme toggle button in Window 1.
3. **Expected Outcome**: Window 2 immediately responds and updates its theme in real-time.
