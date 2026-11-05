# Implementation Tasks: System Settings & Admin Security

**Feature Key**: `ARL-21`  
**Feature Slug**: `008-system-settings-admin-security`  
**Status**: Ready for Implementation  

---

## Task List & Dependency Ordering

### Phase 1: Database Migration & Schema
- [ ] **TASK-01**: Create `supabase/migrations/20261105030000_create_system_settings_table.sql` with singleton `system_settings` table, RLS policies, triggers, and seed record.

### Phase 2: Domain Contracts & Service Layer
- [ ] **TASK-02**: Establish `lib/settings/settings-contracts.ts` re-exporting validation schemas (`reminderSettingsSchema`, `batchStockMinimumsSchema`, `changePasswordSchema`) and DTO types.
- [ ] **TASK-03**: Create `lib/settings/settings-service.ts` supporting `getSystemSettings()`, `updateReminderSettings()`, `getStockMinimumsMatrix()`, `updateBatchStockMinimums()`, and `calculateIsOverdue()`.

### Phase 3: Unit Tests (TDD) & Server Actions
- [ ] **TASK-04**: Implement unit tests in `tests/settings.test.ts` verifying all 4 acceptance criteria scenarios (reminder threshold update, batch stock minimums, password mismatch validation, successful password update).
- [ ] **TASK-05**: Implement Server Actions in `lib/settings/settings-actions.ts` for saving reminder settings, batch updating stock levels, and updating passwords.

### Phase 4: UI Components
- [ ] **TASK-06**: Create `components/settings/settings-tabs.tsx` for accessible, styled tab navigation matching the mockup.
- [ ] **TASK-07**: Create `components/settings/reminder-settings-form.tsx` with live preview and toast notification.
- [ ] **TASK-08**: Create `components/settings/stock-minimums-form.tsx` with 3x3 table matrix for batch editing variant minimum stock levels.
- [ ] **TASK-09**: Create `components/settings/password-form.tsx` with client-side match validation, min-length check, and Supabase Auth submission.

### Phase 5: Routes & Navigation Integration
- [ ] **TASK-10**: Create `app/(admin)/settings/layout.tsx` with shared breadcrumbs, page header, and `SettingsTabs`.
- [ ] **TASK-11**: Update `app/(admin)/settings/page.tsx` to redirect to `/settings/reminders`.
- [ ] **TASK-12**: Implement `app/(admin)/settings/reminders/page.tsx`, `app/(admin)/settings/stock/page.tsx`, `app/(admin)/settings/password/page.tsx`, and adjust `app/(admin)/settings/appearance/page.tsx`.
- [ ] **TASK-13**: Update `lib/layout/nav-config.ts` so Settings points to `/settings/reminders`.

### Phase 6: Verification & Quality Gate
- [ ] **TASK-14**: Run `npm test` and verify all tests pass.
- [ ] **TASK-15**: Verify zero hardcoded colors and strict design token adherence.
