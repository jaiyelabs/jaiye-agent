# Security audit — 2026-07-08 (Claude Code)

Published npm CLI, small attack surface, no network/secrets. Tests green (23/23), typecheck clean at audit time.

## Findings

### M1 — shell injection pattern in `src/core/git.ts` (medium, low practical risk)
`getFilesChangedSince(ref)`, `getFilesInPR(baseBranch)`, `getCommitsInPR(baseBranch)` and `getFilesChangedInCommit(hash)` interpolate their arguments directly into `execSync` command strings. A value like `main; rm -rf ~` would execute.

Real-world risk is low: this is a CLI users run in their own repos with their own args, and the CI `base_branch` is set by the repo owner in their workflow, not by an attacker's PR. But it is a bad pattern in shipped code and a lint/audit tool will flag it.

Fix: switch these to `execFileSync('git', ['diff', '--name-only', ref], ...)`. `src/core/watch.ts` already uses `execFile` — copy that. Args-array form removes the shell entirely.

### L1 — commit-log parse breaks on `|` (low, correctness)
`getRecentCommits` / `getCommitsInPR` parse `git log --format='%H|%an|%s|%aI'` by `.split('|')`. A commit subject containing `|` shifts every field. Use a `%x00` (null) or unlikely multi-char delimiter and split on that.

### README marketing stat (flag only, do not edit)
README claims "37% of multi-agent failures come from integration errors." Unsourced. Per the AI-fingerprint rule, flag it: either cite a source or soften the wording. Left for Rebecca — it's her marketing copy.

## Checked and fine
- No secrets, no env files (`.env` not present, `.jaiye/` and `dist/` gitignored... note `dist/` is gitignored but `files` publishes it — correct for npm).
- No network calls, no eval, no dynamic require.
- `detectMode()` guards every git call so standalone mode won't shell out.
