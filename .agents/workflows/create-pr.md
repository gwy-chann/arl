---
description: Rebase branch onto main, run pre-flight checks, synthesize description, open Pull Request with gh, and synchronize Jira
---

# Workflow: create-pr

Prepares and opens a review-ready Pull Request linked to Jira, verifying code quality and maintaining linear git history.

## Instructions

1. If arguments are provided (`$ARGUMENTS`), treat them as optional PR title, Jira issue key, or description overrides.
2. If no arguments are provided:
   - Identify the current branch (`git branch --show-current`).
   - Extract the linked Jira issue key (e.g. `[ARL-XXX]`) from the branch name or commit messages.
3. Activate and execute the **`create-pr`** skill ([SKILL.md](file:///c:/Users/Roselle%20Tabuena/workspace/arl/.agents/skills/create-pr/SKILL.md)).
4. Follow the progressive steps:
   - **Step 1: Upstream Sync & Rebase**:
     Fetch `origin` and rebase branch onto `origin/main` (`git fetch origin && git rebase origin/main`).
   - **Step 2: Pre-Flight Quality Checks**:
     Run `npx tsc --noEmit` and `npm run lint` (and `npm test` if tests exist).
   - **Step 3: Graphify Impact Analysis**:
     Run `/graphify . --update` to verify zero import cycles.
   - **Step 4: PR Description Synthesis**:
     Synthesize a complete PR title and description adhering to `.github/pull_request_template.md` without empty placeholders.
   - **Step 5: Push & Open PR**:
     Push with lease (`git push -u origin <branch> --force-with-lease`) and open PR via `gh pr create` (or update via `gh pr edit`).
   - **Step 6: Jira Synchronization**:
     Transition Jira ticket to "In Review" and post the formatted completion comment with PR link.

