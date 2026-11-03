# Tasks: Design Token System & Dynamic Theme Switcher

**Feature Key**: `ARL-4`  
**Feature Slug**: `002-design-token-theme-switcher`  
**Jira Story**: STORY-1.3: Design Token System & Dynamic Theme Switcher (Light, Dark, Auto)  

---

## Task List

### Phase 1: Specification & Design (Unit 1)
- [x] **TASK-001**: Generate all 8 canonical SpecKit artifacts in `specs/002-design-token-theme-switcher/`.
- [x] **TASK-002**: Align Gherkin acceptance criteria with Jira ARL-4 scenarios and `mockup/` blueprint.
- [ ] **TASK-003**: Commit Unit 1 specification artifacts via Conventional Commit `docs(specs): [ARL-4] create feature specifications for design token system and theme switcher`.

### Phase 2: Tooling & Dependencies (Unit 2)
- [ ] **TASK-004**: Add `"test": "node --test --experimental-strip-types tests/**/*.test.ts"` script to `package.json`.
- [ ] **TASK-005**: Verify test runner executes cleanly.
- [ ] **TASK-006**: Commit Unit 2 tooling changes via Conventional Commit `chore(tooling): [ARL-4] add native node typescript test runner script`.

### Phase 3: Design Tokens & Token Governance (Unit 3)
- [ ] **TASK-007**: Update `lib/tokens.ts` with `ThemePreference`, `ResolvedTheme`, `THEME_STORAGE_KEY`, and helper contracts.
- [ ] **TASK-008**: Update `app/globals.css` with semantic brand gradient tokens and verify CSS variable mappings.
- [ ] **TASK-009**: Commit Unit 3 design token changes via Conventional Commit `feat(tokens): [ARL-4] extend design tokens with theme preferences and semantic brand gradients`.

### Phase 4: Domain Logic & Automated Unit Tests (Unit 4)
- [ ] **TASK-010**: Implement theme resolver logic (`resolveEffectiveTheme`, validation predicates) in `lib/theme/theme-contracts.ts` and `lib/theme/theme-utils.ts`.
- [ ] **TASK-011**: Write automated unit tests in `tests/theme.test.ts` covering theme resolution for light, dark, auto + OS permutations, and storage validation.
- [ ] **TASK-012**: Run `npm test` to verify 100% test pass rate.
- [ ] **TASK-013**: Commit Unit 4 domain logic and tests via Conventional Commit `feat(theme): [ARL-4] implement theme resolution domain logic and unit tests`.

### Phase 5: UI Components, Zero-FOUC Script, Pages & Toast Notifications (Unit 5)
- [ ] **TASK-014**: Create `components/theme/theme-script.tsx` with blocking pre-DOM-paint inline script for zero FOUC.
- [ ] **TASK-015**: Create `components/ui/toast-provider.tsx` and `components/ui/toast.tsx` supporting auto-dismissing affirmative feedback pills.
- [ ] **TASK-016**: Create `components/theme/theme-provider.tsx` and `components/theme/use-theme.ts` supporting `theme`, `resolvedTheme`, `setTheme`, `toggleTheme`, cross-tab sync, and toast dispatches.
- [ ] **TASK-017**: Create reusable `components/theme/theme-toggle.tsx` and `components/theme/theme-picker.tsx`.
- [ ] **TASK-018**: Integrate `ThemeScript`, `ThemeProvider`, and `ToastProvider` into `app/layout.tsx`.
- [ ] **TASK-019**: Update `app/login/page.tsx` and `app/dashboard/page.tsx` to eliminate arbitrary hex values and consume universal theme toggle.
- [ ] **TASK-020**: Create `/settings/appearance/page.tsx` with full 3-card theme picker (`Light`, `Dark`, `System default`).
- [ ] **TASK-021**: Commit Unit 5 UI components and routes via Conventional Commit `feat(ui): [ARL-4] implement zero-FOUC script, universal theme provider, toggle, picker, and toast system`.

### Phase 6: Tasks Sync, Verification Gates & PR (Unit 6)
- [ ] **TASK-022**: Run full verification suite: `npm test`, `npm run lint`, `npm run build`.
- [ ] **TASK-023**: Run token compliance grep to guarantee zero arbitrary hex in UI templates.
- [ ] **TASK-024**: Mark all tasks complete and commit Unit 6 sync via `docs(specs): [ARL-4] update implementation tasks and quickstart verification receipts`.
- [ ] **TASK-025**: Push branch `feat/ARL-4-design-token-theme-switcher` and open Pull Request with `gh pr create`.
- [ ] **TASK-026**: Post Jira status and completion changelog comment via `addOrEditJiraIssueComment`.
