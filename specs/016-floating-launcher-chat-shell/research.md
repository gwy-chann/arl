# Research & Technical Architecture: Floating Launcher & Minimalist Chat Shell

**Feature Key**: `ARL-30`  
**Feature Slug**: `016-floating-launcher-chat-shell`  
**Parent Epic**: `ARL-29` (In-App AI Operational Assistant)  

---

## 1. Technical Stack Constraints

- **Framework**: Next.js 16 App Router (React 19, Server & Client Components).
- **Styling**: Tailwind CSS v4 using semantic utility classes (`app/globals.css`).
- **Icons**: Restrained single-stroke SVG icons matching existing `components/layout/icons.tsx` design language.
- **Theme Support**: Universal automatic dark mode via CSS variables without hardcoded hexes or manual `dark:` overrides.
- **Testing**: Node.js built-in test runner (`node --test --experimental-strip-types "tests/*.test.ts"`).

---

## 2. Component Architecture & Placement

### Mounting Location
The chat shell needs to be visible across all authenticated administrative routes (`/(admin)/*`) while remaining absent on the unauthenticated login screen (`/login`).
- `app/(admin)/layout.tsx` wraps children with `<AppShell user={userInfo}>{children}</AppShell>`.
- `components/layout/app-shell.tsx` is already a client component (`'use client'`).
- Mounting `<AssistantChatWidget />` inside `AppShell` ensures:
  1. Universal availability across all admin views (`/dashboard`, `/inventory`, `/products`, `/sales`, `/customers`, `/reports`, `/settings`).
  2. Automatic unmount on public routes (`/login`).
  3. Seamless coordination with the existing `LayoutProvider` or dedicated `AssistantContext`.

### Component Structure
```
components/assistant/
├── assistant-chat-widget.tsx    # Root container managing open/collapsed state and keyboard listeners
├── assistant-launcher-pill.tsx  # Compact fixed bottom-right button with live dot & label
├── assistant-popover.tsx        # Shell window (Header, MessageList, InputBar, SuggestionSlot)
├── assistant-header.tsx         # Header bar with title, status indicator, clear & close actions
├── assistant-message-list.tsx   # Scrollable stream of user and assistant messages + auto-scroll
├── assistant-input-bar.tsx      # Textarea/input with Enter-to-send, send icon button
├── assistant-icons.tsx          # Single-stroke SVGs (Chat, Send, Close, Minimize, Trash)
└── use-assistant-chat.ts        # Client hook encapsulating message state, persistence & handlers
```

---

## 3. UI/UX Decision Matrix: Popover vs. Drawer vs. Modal

| Criteria | Floating Lower-Right Popover (Selected) | Sliding Side Drawer | Centered Modal Dialog |
| :--- | :--- | :--- | :--- |
| **Data Visibility** | **High**: Admin can inspect tables, search rows, and read figures while conversing. | **Medium**: Masks 40% of horizontal table width; breaks table layout. | **Low**: Completely blocks view with scrim backdrop. |
| **Workflow Interruption** | **Zero**: Non-modal; admin retains focus on their primary task. | **Medium**: Disrupts table horizontal space. | **High**: Blocks entire screen; requires dismissal. |
| **Mobile Adaptability** | **High**: Expands responsively to bottom sheet or viewport width on `<640px`. | **High**: Full-screen slide-over. | **Medium**: Clutters smaller viewports. |
| **No-Emoji Restraint** | **Compliant**: Clean typography, subtle borders, single-stroke SVGs. | Compliant. | Compliant. |

---

## 4. State Management & Session Persistence Strategy

1. **State Isolation**:
   - `isOpen`: Boolean toggling between launcher pill and expanded popover.
   - `messages`: Array of `ChatMessage` objects (`id`, `role`: `'user' | 'assistant' | 'system'`, `content`, `timestamp`).
   - `status`: Assistant operational status (`'idle' | 'typing' | 'error'`).
   - `inputValue`: Current draft query in input field.

2. **Persistence Mechanism**:
   - `sessionStorage` key: `arlq_assistant_messages` & `arlq_assistant_open`.
   - Ensures that navigating between pages (`/inventory` to `/sales`) preserves the active conversation.
   - Closing browser tab or ending session clears data naturally without polluting persistent server storage.

---

## 5. Downstream Integration Readiness

- **ARL-31 (Suggested Question Chips)**:
  - `assistant-popover.tsx` provides a dedicated slot/container `<div data-testid="assistant-suggested-prompts">` above the input bar where quick-starter chips can render when the stream is empty or between responses.
- **ARL-34 (Debounce & Rate-Limit Handling)**:
  - Input submission includes a configurable debounce and disabled state during processing to prevent rapid multi-turn requests against the Gemini Flash Free Tier quota.
