# Implementation Plan: Floating Launcher & Minimalist Lower-Right Chat Shell

**Feature Key**: `ARL-30`  
**Feature Slug**: `016-floating-launcher-chat-shell`  
**Parent Epic**: `ARL-29` (In-App AI Operational Assistant)  

---

## 1. Technical Architecture & File Inventory

### 1.1 Core Contracts & Types
- `lib/contracts/assistant-contracts.ts`:
  - Domain interfaces (`ChatMessage`, `ChatRole`, `AssistantStatus`, `AssistantShellState`).
  - Validation schemas (Zod).
  - Pure invariant utilities (`containsEmoji`, `createChatMessage`, `DEFAULT_WELCOME_MESSAGE`).

### 1.2 UI Components (`components/assistant/`)
- `assistant-icons.tsx`: Single-stroke SVG icon set (`MessageSquareIcon`, `SendIcon`, `CloseIcon`, `MinimizeIcon`, `TrashIcon`).
- `assistant-launcher-pill.tsx`: Collapsed state button fixed at `bottom-6 right-6 z-50` with live status dot and text `"Store Assistant"`.
- `assistant-header.tsx`: Header component with title, status indicator dot, "Clear" button, and minimize/close toggle.
- `assistant-message-list.tsx`: Scrollable container displaying turn-by-turn messages with auto-scroll and welcome state.
- `assistant-input-bar.tsx`: Text input with `Enter`/`Shift+Enter` listeners, character validation, and single-stroke send button.
- `assistant-popover.tsx`: Window container coordinating header, message list, starter prompt container slot (ARL-31), and input bar.
- `assistant-chat-widget.tsx`: Root client component coordinating open/collapse state, keyboard listeners (`Esc`), and session persistence.
- `use-assistant-chat.ts`: Custom React hook encapsulating state, session storage sync, message sending, and clearing.

### 1.3 Layout Integration
- `components/layout/app-shell.tsx`:
  - Mount `<AssistantChatWidget />` within `AppShell` so it floats unobtrusively across all admin routes.

### 1.4 Test Suite
- `tests/assistant-shell.test.ts`:
  - Unit & contract tests validating schemas, zero-emoji invariant, state transitions, message factory, and clear actions.

---

## 2. Design Tokens & Styling Strategy

| Element | Semantic Tokens | Dark Mode Behavior |
| :--- | :--- | :--- |
| **Launcher Pill** | `bg-bg-surface text-text-primary border border-border shadow-md hover:bg-bg-hover` | Inherits dark surface via `--bg-surface` and `--border` |
| **Status Dot (Active)** | `bg-success` (with subtle pulse) | Green indicator `--success` |
| **Popover Window** | `bg-bg-surface border border-border shadow-xl rounded-lg` | Seamless `--bg-surface` and `--border` adaptation |
| **Header** | `bg-bg-surface border-b border-border text-text-primary` | Consistent header surface |
| **User Message Bubble** | `bg-primary text-text-light rounded-lg` | High-contrast brand green `--primary` with white text |
| **Assistant Bubble** | `bg-bg-muted border border-border text-text-primary rounded-lg` | Clean neutral card surface with subtle outline |
| **Input Bar** | `bg-bg-input border border-border text-text-primary focus:border-border-focus` | Crisp input styling |
| **Send Button** | `bg-primary text-text-light hover:bg-primary-hover disabled:opacity-50` | Primary action styling |

---

## 3. Verification & Quality Gates

1. **Zero-Emoji Audit**: Grep across all new files to confirm 0 instances of Unicode emoji characters.
2. **Zero-Hardcoded-Color Audit**: Grep for arbitrary hex codes (`#...`) or standard Tailwind color names (`text-gray-`, `bg-blue-`) to verify 100% token usage.
3. **Automated Test Suite**: Run `npm test` to verify all 198 existing tests pass alongside the new `tests/assistant-shell.test.ts` suite.
4. **Lint & Typecheck**: Run `npm run lint` and TypeScript compilation check.
