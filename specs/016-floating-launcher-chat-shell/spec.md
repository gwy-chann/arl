# Feature Specification: Floating Launcher & Minimalist Lower-Right Chat Shell (No-Emoji / Clean Design)

**Feature Key**: `ARL-30`  
**Feature Slug**: `016-floating-launcher-chat-shell`  
**Jira Story**: STORY-6.1: Floating Launcher & Minimalist Lower-Right Chat Shell (No-Emoji / Clean Design)  
**Parent Epic**: EPIC-6: In-App AI Operational Assistant (Gemini Flash Free Tier) (`ARL-29`)  
**Status**: Ready for Planning & Implementation  

---

## 1. User Story

**As an** ARLQ store administrator,  
**I want** a discreet, collapsible chat assistant widget in the bottom-right corner of my screen,  
**so that** I can consult store inventory, sales ledger, and customer utang data anytime without leaving my current workspace, obstructing data tables, or dealing with emoji clutter.

---

## 2. Context & Technical Rationale

The ARLQ Inventory and Sales System operates in high-volume condiment distribution environments where administrators frequently navigate stock movement ledgers, sales invoicing wizards, and customer debt balances. Introducing operational AI capabilities requires a discreet, non-disruptive user interface:

1. **Lower-Right Fixed Placement**:
   - Anchored at `fixed bottom-6 right-6 z-50` across all administrative pages.
   - Collapsed state: Compact pill button labeled `Store Assistant` with an active status dot and single-stroke message glyph.
   - Expanded state: An understated, non-modal popover window (width: ~380px, height: ~520px, with responsive clamping `w-[calc(100vw-2rem)] sm:w-[380px] max-h-[calc(100vh-6rem)]`).

2. **Visual Aesthetics (Strict Zero-Emoji & Restrained UI Rule)**:
   - **Zero emoji policy**: Absolutely no emojis in headers, launcher pills, starter questions, message text, buttons, empty states, or error notifications.
   - Single-stroke functional icons: Minimal SVG iconography with clean strokes (Chat Bubble, Close `×`, Minimize `−`, Send arrow, Reset/Trash).
   - Semantic tokens only: Every surface, border, text color, and button style strictly consumes classes defined in `app/globals.css` and `lib/tokens.ts` (`bg-bg-surface`, `bg-bg-base`, `text-text-primary`, `border-border`, `bg-primary`, `text-text-light`).
   - Zero hardcoded hex colors or arbitrary brackets (e.g., `#095B06`, `#1F2933`).

3. **Shell Controls & Workflow**:
   - Header bar with title ("Store Assistant"), operational status dot (Ready / Active), "Clear" button to reset the session, and minimize/close toggle.
   - Scrollable message viewport with auto-scroll to the latest turn upon new messages.
   - Fixed bottom input bar with auto-resizing text field, send action, and keyboard listeners (`Enter` sends, `Esc` minimizes shell).
   - Container support for suggested question starter chips (ARL-31) and request status debouncing (ARL-34).

---

## 3. Business Invariants & UI Rules

1. **Unobtrusive Docking**:
   - The launcher pill MUST remain anchored at the bottom-right corner (`fixed bottom-6 right-6 z-50`) regardless of scroll position on all `/(admin)` routes via `AppShell`.
   - In collapsed state, the pill's footprint is minimal (approx. 40px height, 160px width) ensuring zero obstruction of table action menus, pagination controls, or receipt previews.
   - In expanded state, the chat shell MUST float above the page content without triggering page-level horizontal or vertical scrollbars.

2. **Session State Persistence (Client-Side Memory)**:
   - Chat shell open/collapsed state persists across in-app navigations within the session (`sessionStorage` or local component state).
   - Chat message history persists during client route transitions within the session, allowing an admin to open the assistant, navigate to another page (e.g., `/inventory` to `/sales`), and continue the conversation without losing context.
   - Clicking `"Clear"` resets the message stream back to the initial welcome state.

3. **Strict Zero-Emoji Invariant**:
   - System prompts, placeholder strings, button labels, initial greetings, and sample chips MUST NOT contain emojis (e.g., no 👋, 🤖, 💡, 🚀).
   - System welcome text must read professionally: `"Ask questions about store inventory, sales, customer utang balances, or pricing."`

4. **Universal Theme Adaptability**:
   - The shell must dynamically adapt when switching between Light, Dark, and Auto theme preferences.
   - Contrast ratios must comply with WCAG 2.1 AA standards for all text elements against their respective bubble and container backgrounds.

5. **Keyboard & Accessibility Standards**:
   - Pressing `Esc` when the chat shell is open collapses the shell and returns focus to the launcher pill.
   - The input field accepts `Enter` to dispatch the prompt and `Shift+Enter` to insert a newline.
   - ARIA roles: The popover carries `role="region"` or `role="dialog"` with `aria-label="Store Assistant Chat"`, and the launcher pill carries `aria-expanded` reflecting its toggled state.

---

## 4. Acceptance Criteria (Gherkin Scenarios)

### Scenario 1: Collapsed Launcher Pill in Lower-Right Corner
- **Given** an authenticated admin viewing any dashboard or data table (`/(admin)/*`)
- **When** the page renders
- **Then** a floating launcher is anchored at `fixed bottom-6 right-6` with a live status indicator and clean text `"Store Assistant"`
- **And** no emojis or loud saturated accents are displayed
- **And** the launcher has an accessible `aria-expanded="false"` attribute.

### Scenario 2: Expanding and Minimizing Chat Shell
- **Given** the chat launcher in collapsed state
- **When** the admin clicks the launcher
- **Then** it expands into an understated popover window (~380px wide, ~520px tall) containing header, message stream container, and input bar
- **And** `aria-expanded="true"` is set on the container
- **And** the text input is automatically focused for immediate typing
- **When** the admin presses the `Esc` key or clicks the close/minimize button
- **Then** the popover smoothly collapses back to the launcher pill without page reload.

### Scenario 3: Universal Theme Consistency
- **Given** the chat shell is open
- **When** the theme switches between light, dark, and auto
- **Then** all surfaces (`bg-bg-surface`, `bg-bg-base`, `bg-bg-card`), borders (`border-border`), and text (`text-text-primary`, `text-text-secondary`) dynamically adapt via CSS variables without hardcoded hex colors
- **And** message bubbles maintain compliant contrast in both light and dark themes.

### Scenario 4: Chat Stream & Message Clearing
- **Given** an expanded chat shell with an existing conversation history
- **When** the admin clicks the `"Clear"` button in the header
- **Then** the message history is cleared and the view resets to the initial clean welcome state
- **And** no emojis are displayed in the reset state.

### Scenario 5: Mobile & Small Screen Responsiveness
- **Given** an admin viewing the application on a mobile viewport (<640px)
- **When** the chat shell is expanded
- **Then** the popover window adjusts dynamically to fit within screen bounds (`w-[calc(100vw-2rem)]` and `max-h-[calc(100vh-6rem)]`) with appropriate padding and touch-friendly target sizes (min 44px).
