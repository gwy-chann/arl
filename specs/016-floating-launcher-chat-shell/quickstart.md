# Quickstart & Verification Guide: Floating Launcher & Minimalist Chat Shell

**Feature Key**: `ARL-30`  
**Feature Slug**: `016-floating-launcher-chat-shell`  

---

## 1. Automated Verification (Unit & Contract Tests)

Execute the test suite inside the worktree:

```bash
cd .worktrees/ARL-30
npm test
```

To run only the assistant shell tests:

```bash
node --no-warnings=ExperimentalWarning --test --experimental-strip-types "tests/assistant-shell.test.ts"
```

---

## 2. Interactive Manual Verification Steps

### Scenario 1: Launcher Placement & Collapsed View
1. Log in to the ARLQ administrator dashboard (`/dashboard`).
2. Observe the bottom-right corner of the viewport.
3. **Verify**:
   - The launcher pill is anchored at `fixed bottom-6 right-6 z-50`.
   - The pill displays a single-stroke message icon, a live green status dot, and the clean text `"Store Assistant"`.
   - No emojis or saturated accents appear anywhere on the launcher.
   - Scrolling the dashboard does not obscure or dislodge the pill.

### Scenario 2: Expanding & Minimizing via Clicks
1. Click the `"Store Assistant"` launcher pill.
2. **Verify**:
   - The pill smoothly transitions/expands into a popover window (~380px wide, ~520px high).
   - The header displays `"Store Assistant"`, a ready status dot, a `"Clear"` button, and a minimize/close button (`−` or `×`).
   - The empty message viewport displays the restrained greeting: `"Ask questions about store inventory, sales, customer utang balances, or pricing."`
   - The input field at the bottom is immediately focused with placeholder `"Ask a question..."`.
3. Click the minimize/close button in the header.
4. **Verify**:
   - The popover closes and returns to the compact launcher pill.

### Scenario 3: Keyboard Accessibility
1. Click the launcher pill to open the popover.
2. Press the `Esc` key on the keyboard.
3. **Verify**:
   - The popover collapses immediately.
4. Re-open the popover.
5. Type `"Check low stock items"` and press `Enter`.
6. **Verify**:
   - The message is posted into the chat stream as a user bubble.
   - The input field clears automatically.
7. Type a multi-line message by pressing `Shift+Enter`.
8. **Verify**:
   - A newline is inserted without submitting the form.

### Scenario 4: Conversation History & Clear Action
1. Send 1 or 2 messages.
2. Observe that messages render cleanly in the scrollable stream with proper user vs. assistant alignment.
3. Click the `"Clear"` button in the header.
4. **Verify**:
   - The conversation stream is cleared back to the initial clean welcome message.

### Scenario 5: Theme Switching & Contrast
1. Open the assistant popover.
2. Toggle theme between Light, Dark, and Auto (using the theme switcher in `/settings/appearance` or topbar).
3. **Verify**:
   - All surfaces (`bg-bg-surface`, `bg-bg-base`, `bg-bg-card`), borders (`border-border`), and text colors adapt seamlessly.
   - Zero hardcoded colors are present; contrast remains sharp and readable in dark mode.

### Scenario 6: Mobile Responsiveness
1. Open DevTools in mobile responsive view (width: 375px or 414px).
2. Expand the chat assistant.
3. **Verify**:
   - The popover clamps to `w-[calc(100vw-2rem)]` and does not cause horizontal page overflow.
   - Touch targets for buttons are at least 44px.
