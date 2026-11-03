# Feature Specification: Design Token System & Dynamic Theme Switcher (Light, Dark, Auto)

**Feature Key**: `ARL-4`  
**Feature Slug**: `002-design-token-theme-switcher`  
**Jira Story**: STORY-1.3: Design Token System & Dynamic Theme Switcher (Light, Dark, Auto)  
**Epic**: EPIC-1: Foundation, Authentication Hub & App Shell (`ARL-1`)  
**Status**: In Progress  

---

## 1. User Story

**As an** ARLQ store administrator,  
**I want to** toggle between Light mode, Dark mode, and System default preferences with persistent storage,  
**so that** the application is comfortable to read in warehouse or office lighting without hardcoded color conflicts.

---

## 2. Business Invariants & Rules

1. **Light Mode as Authoritative Default**: In the absence of an explicit user selection in `localStorage` (`arlq-theme`), the system evaluates `auto`. When system preference cannot be determined or prefers light, it defaults to the crisp, warm-tinted Light theme (`#F7F7F4` base, `#FFFFFF` surfaces).
2. **Three Preference Modes (`light` | `dark` | `auto`)**:
   - `light`: Forces light mode theme regardless of host OS settings.
   - `dark`: Forces dark mode obsidian theme regardless of host OS settings.
   - `auto`: Dynamically tracks the client host operating system's `prefers-color-scheme`.
3. **Zero Flash of Unstyled Content (FOUC)**: An inline, blocking execution script must run in the document `<head>` prior to DOM paint and Next.js hydration. If the stored preference (or evaluated auto preference) is `dark`, `data-theme="dark"` (and class `dark`) is placed on `document.documentElement` immediately.
4. **Dynamic Live Synchronization**: When in `auto` mode, changes to the operating system's color scheme (via `prefers-color-scheme` media query) must trigger an instant UI transition without requiring a page reload.
5. **Cross-Tab & Window State Sync**: Changing theme preference in one tab must immediately sync to all active tabs/windows via window `storage` event broadcasting.
6. **Strict Token Compliance (Zero Arbitrary Hex Rule)**: All UI components across the application must strictly consume semantic CSS variables and Tailwind utility classes (`bg-bg-base`, `bg-bg-surface`, `bg-primary`, `text-text-primary`, `border-border`, etc.). Hardcoded hex codes, RGB values, or unmapped Tailwind default colors (`text-gray-900`, `bg-blue-600`) are strictly forbidden in UI components.
7. **Affirmative Toast Notification**: Every user-initiated theme change must trigger an affirmative feedback toast notification conforming to mockup visual standards:
   - Switching to Dark mode: `"Dark mode enabled"`
   - Switching to Light mode: `"Light mode enabled"`
   - Selecting System default: `"Theme set to System default"`
8. **Downstream Foundation Contract**: Serves as the bedrock design token system consumed by ARL-2 (Auth Hub), ARL-3 (Responsive Layout Shell), ARL-5 (Modals & Toasts), and ARL-21 (System Settings).

---

## 3. Gherkin Acceptance Criteria

### Scenario 1: One-Click Topbar Theme Toggle
```gherkin
Feature: One-Click Topbar Theme Toggle
  Scenario: Toggling theme from topbar
    Given an admin is viewing any page in default Light mode
    When the admin clicks the theme toggle button in the topbar
    Then the "data-theme" attribute on "<html>" is set to "dark"
    And the "dark" class is applied to "<html>"
    And all surfaces, typography, and borders switch instantly to dark obsidian tokens
    And an affirmative toast displays "Dark mode enabled"
    And "arlq-theme" in localStorage is updated to "dark"
```

### Scenario 2: System Default Preference Live Sync
```gherkin
Feature: System Default Preference Sync
  Scenario: Live synchronization with OS preference in Auto mode
    Given the admin has selected "System default" (auto) preference on "/settings/appearance"
    When the host operating system toggles between light and dark modes
    Then the application dynamically switches themes without requiring a page reload
    And "<html>" updates "data-theme" in real-time
```

### Scenario 3: Zero Flash of Unstyled Content (FOUC)
```gherkin
Feature: Zero Flash of Unstyled Content
  Scenario: Cold boot or hard refresh with Dark preference saved
    Given an administrator with "arlq-theme" set to "dark" in localStorage
    When the administrator opens a new window, reloads, or navigates to the app
    Then an inline blocking script evaluates "arlq-theme" prior to initial DOM paint
    And the document root renders with "data-theme='dark'" from the first frame
    And zero light flash is perceptible to the human eye
```

### Scenario 4: Strict Token Compliance Audit
```gherkin
Feature: Strict Design Token Compliance
  Scenario: Static and dynamic verification of semantic tokens
    Given all React components and JSX templates in the codebase
    When scanning class names and style definitions
    Then 100% of background, text, and border utilities derive from semantic design tokens
    And zero arbitrary bracket hex values (e.g. "dark:from-[#166534]") exist in component code
```

### Scenario 5: Cross-Tab Storage Event Synchronization
```gherkin
Feature: Cross-Tab Theme Sync
  Scenario: Theme change in Tab A updates Tab B instantly
    Given Tab A and Tab B are open to the ARLQ application
    When the user changes the theme to "dark" in Tab A
    Then a "storage" event triggers in Tab B
    And Tab B updates its theme state and document root to dark without reloading
```

---

## 4. UI Specification (SSOT: `mockup/`)

### 4.1. Topbar Theme Toggle
- Icon: Sun icon (`isDark ? sun : moon`), displaying appropriate icon and text.
- Styling: Rounded badge with `bg-secondary hover:bg-secondary-hover text-text-primary border border-border-subtle shadow-xs`.
- Mobile responsiveness: Collapses gracefully or fits in compact topbar.

### 4.2. Settings Appearance Theme Picker
- 3-column card grid (`.theme-picker`):
  1. **Light mode**: Sun icon, preview showing warm white header and surface, label "Light mode", subtext "Default clean white canvas".
  2. **Dark mode**: Moon icon, preview showing obsidian surfaces (`#111827`, `#1F2937`) with emerald accents, label "Dark mode", subtext "High-contrast dark obsidian for low light".
  3. **System default**: Monitor/Auto icon, preview showing split dual-tone appearance, label "System default", subtext "Automatically matches your device settings".
- Selected state: `border-primary bg-primary-light` (or `var(--brand-soft)`).

### 4.3. Toast Notification Component
- Fixed bottom center (`bottom: 22px; left: 50%; transform: translateX(-50%)`).
- Floating pill: checkmark SVG icon + status text, automatic dismissal after 2.8s.
- Tokenized styling: `bg-text-primary text-text-light dark:bg-bg-surface dark:text-text-primary dark:border dark:border-border shadow-lg`.
