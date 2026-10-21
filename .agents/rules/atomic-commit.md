# Atomic Layer-by-Layer Commit Guidelines

To maintain an auditable, high-velocity, and bisectable Git history, all modifications must be divided into **atomic, single-purpose commits** ordered by architectural layer.

---

## 1. Commit Unit Architecture

Work must be split across the following sequence of architectural units:

| Unit | Scope & Layer | Conventional Commit Format | Contents & Responsibilities |
| :--- | :--- | :--- | :--- |
| **Unit 1** | **Specification & Design** | `docs(specs): [<KEY>] <summary>` | PRDs, feature specs, wireframes, architectural decisions, and requirement docs in `docs/`. |
| **Unit 2** | **Tooling & Dependencies** | `chore(tooling): [<KEY>] <summary>` | Dependency additions (`package.json`, `package-lock.json`), linter/formatter configs, environment configs, build script adjustments. |
| **Unit 3** | **Database & Schemas** | `feat(db): [<KEY>] <summary>` | Schema definitions, migration files, seed data, DB connection setup, and database types. |
| **Unit 4** | **Domain Logic & Tests** | `feat(<scope>): [<KEY>] <summary>` | Pure domain logic, computation formulas, service layers, data access repositories, validation schemas, and automated unit tests. |
| **Unit 5** | **UI Components & Routes**| `feat(<scope>): [<KEY>] <summary>` | React components, Next.js page routes, layout shells, forms, modals, tables, and Tailwind styling. |
| **Unit 6** | **Tasks & Sync** | `docs(specs): [<KEY>] <summary>` | Documentation updates, task checklists, API usage examples, and milestone syncs. |

---

## 2. Commit Format & Key Traceability

Every commit message must follow this standardized structure:

```
<type>(<scope>): [<KEY>] <imperative mood summary>

- Detailed bullet point describing specific change and rationale
- Another diff-accurate change description

Refs: #<ISSUE_ID>
```

### Commit Key Rules
- `[<KEY>]` represents the issue, feature tag, or work ticket (e.g., `[ARLQ-101]`, `[DESIGN-SYS]`, `[INVENTORY-CORE]`).
- The subject line must be in the imperative mood ("add", "configure", "implement", "fix", NOT "added" or "adds").
- Avoid generic summaries like `WIP`, `fixed bugs`, `updates`, or `clean up`.

---

## 3. Diff-Accurate Commit Descriptions

Commit bodies must be strictly diff-accurate:
- Describe **what** actually changed in the diff and **why**.
- Do not claim changes that are not present in the staged files.
- Never bundle unrelated files across different units (e.g., do not commit database schema migrations and UI buttons in the same commit).

---

## 4. Banned Anti-Patterns

1. **Monster / Mega Commits**: Committing an entire full-stack feature (spec, schema, backend, frontend, docs) in a single commit is strictly prohibited.
2. **Broken Intermediate Commits**: Each commit must leave the codebase in a compilable state (`npm run build` and tests must pass).
3. **Dead Code / Secret Leaks**: Never commit `.env.local`, API keys, scratch logs, or temporary debug scripts.
