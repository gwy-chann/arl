# Requirements Quality Checklist: Floating Launcher & Minimalist Lower-Right Chat Shell

**Feature Key**: `ARL-30`  
**Feature Slug**: `016-floating-launcher-chat-shell`  

---

## 1. Requirement Completeness & Scope Validation

- [x] **Clear Persona & Value**: ARLQ store administrator needs quick access to operational insights without losing context or blocking data tables.
- [x] **Docking Position**: Launcher anchored at `fixed bottom-6 right-6 z-50` across all admin routes.
- [x] **Collapsed Launcher Pill**: Compact pill with clean icon, live status dot, and text `"Store Assistant"`.
- [x] **Expanded Popover Window**: Popover with header, scrollable message viewport, and input bar (~380px wide, ~520px high).
- [x] **Responsiveness**: Fits properly on mobile screens (<640px) with `w-[calc(100vw-2rem)]` and `max-h-[calc(100vh-6rem)]`.
- [x] **Zero Emoji Enforcement**: Guaranteed zero emoji across all labels, headers, messages, and icons.
- [x] **Keyboard Navigation**: `Esc` collapses popover, `Enter` sends message, `Shift+Enter` adds newline.
- [x] **Conversation Clear Action**: Dedicated "Clear" action in header resets conversation to initial state.
- [x] **Integration Preparedness**: Provides slot/container for suggested prompts (ARL-31) and debounce status (ARL-34).

---

## 2. Design System & Token Compliance (`AGENTS.md`)

- [x] **Zero Hardcoded Colors**: No inline hex `#095B06`, `#1F2933`, `#E4E4DF`, or arbitrary Tailwind brackets `bg-[#...]`.
- [x] **Semantic Surface Classes**: Uses `bg-bg-surface`, `bg-bg-base`, `bg-bg-card`, `bg-bg-input`, `bg-bg-hover`.
- [x] **Semantic Text Classes**: Uses `text-text-primary`, `text-text-secondary`, `text-text-muted`, `text-text-light`.
- [x] **Semantic Border Classes**: Uses `border-border`, `border-border-subtle`, `border-border-focus`.
- [x] **Semantic Brand & Status Classes**: Uses `bg-primary`, `hover:bg-primary-hover`, `text-success`, `bg-success`.
- [x] **Universal Dark Mode**: Seamlessly switches between light, dark, and auto modes via CSS custom properties.

---

## 3. Accessibility & Usability (WCAG 2.1 AA)

- [x] **ARIA Semantics**: `aria-expanded` on launcher pill; `role="region"` or `role="dialog"` with `aria-label="Store Assistant Chat"` on popover.
- [x] **Accessible Icon Buttons**: All icon-only buttons (Close, Minimize, Clear, Send) have descriptive `aria-label` and `title` attributes.
- [x] **Focus Management**: Focus lands in input field when expanded, returns to launcher on collapse via `Esc`.
- [x] **Color Contrast**: Complies with minimum 4.5:1 text-to-background contrast ratio in both light and dark themes.
- [x] **Touch Targets**: Minimum 40px/44px touch targets for mobile accessibility.
