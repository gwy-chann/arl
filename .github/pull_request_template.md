## 🎫 Jira Ticket
- **Jira Issue**: [ARL-XXX](https://your-domain.atlassian.net/browse/ARL-XXX)
- **Type**: Feature | Bugfix | Refactor | Chore | Hotfix

---

## 📌 Summary
A concise 2–3 sentence overview of what this PR accomplishes, the business or technical motivation, and the core approach taken.

---

## 🛠️ Changes Included

### Added
- Feature / component / endpoint 1
- Feature / component / endpoint 2

### Changed / Updated
- Modified behavior or refactored component 1

### Fixed / Removed
- Bug fixed or deprecated code removed

---

## 🏛️ Architectural & Knowledge Graph Impact
- **Modules / Subsystems Affected**: `lib/supabase`, `middleware.ts`, etc.
- **Import Cycles**: None introduced (verified via Graphify)
- **Knowledge Graph**: Updated via `/graphify . --update` ([GRAPH_REPORT.md](file:///path/to/graphify-out/GRAPH_REPORT.md))

---

## 📸 Visuals (UI / UX Changes Only)
*(Include screenshots, GIFs, or WebP recordings if frontend or visual elements were changed)*

| Before | After |
| :---: | :---: |
| *(Image / Screenshot)* | *(Image / Screenshot)* |

---

## 🧪 How to Test & Verify

1. **Checkout & Install Dependencies**:
   ```bash
   git checkout <branch-name>
   npm install
   ```
2. **Environment & Service Setup**:
   - Ensure environment variables are populated in `.env.local` based on `.env.example`.
3. **Step-by-Step Test Scenarios**:
   - Step 1: Navigate to `http://localhost:3000/...`
   - Step 2: Perform action X and verify expectation Y.
   - Step 3: Inspect network requests / cookies / console for expected behavior.

---

## ✅ Pre-Merge Checklist

- [ ] **Jira Linked**: Title and description reference the correct `ARL-XXX` ticket.
- [ ] **Rebased**: Branch is cleanly rebased onto the latest target branch (`main`) with no merge commits.
- [ ] **Typecheck**: `npx tsc --noEmit` passes with 0 errors.
- [ ] **Linting**: `npm run lint` passes without warnings/errors.
- [ ] **Secrets Audit**: No sensitive tokens, `.env.local`, or credentials committed.
- [ ] **Diff Reviewed**: Self-reviewed the diff against `main`.
