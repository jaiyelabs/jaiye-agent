# Dogfood Case: Same-File Agent Collision

This case shows the core `jaiye-agent` signal: two different agents touched the same file in the same PR window.

## Setup

Ownership is declared in `.jaiye/config.yaml`:

```yaml
agents:
  - name: claude
    description: "Primary architect"
    commit_prefix: "[claude]"
  - name: codex
    description: "Integration and testing"
    commit_prefix: "[codex]"

ownership:
  - pattern: "src/**"
    agent: claude
  - pattern: "tests/**"
    agent: codex
```

In this setup, Claude owns `src/**`. Codex can work on tests, validation and integration, but a Codex commit touching `src/**` should be reviewed before merge.

## Collision

Two commits touch the same source file:

```bash
git commit -m "[claude] update auth flow"
git commit -m "[codex] wire auth validation"
```

Both commits include `src/auth.ts`.

Git can still merge this if the edits are on different lines. That is the point: this is not a line-level merge conflict. It is an agent coordination conflict.

## Check

Run:

```bash
jaiye-agent check --base main
```

Expected result:

```text
jaiye-agent check

Checking file ownership (main...HEAD)

CONFLICT  src/auth.ts
  - [codex] 2b81af3: [codex] wire auth validation
  - [claude] 6f4dde5: [claude] update auth flow

1 conflict found.
Each file should be owned by one agent per PR.
Fix: coordinate handoffs or update .jaiye/config.yaml ownership rules.
```

## Handoff

The fix is not to block one agent forever. The fix is to make the boundary crossing explicit:

```bash
jaiye-agent handoff --from claude --to codex --summary "auth flow is ready, add validation tests"
jaiye-agent touch --agent codex tests/auth.test.ts
```

Now the handoff records why work moved from one agent to another and the test work stays in the path Codex owns.

## Why It Matters

Worktree tools isolate edits. Hosted orchestrators run agents. `jaiye-agent` catches the repo-governance problem between those layers: agents can each do reasonable work and still drift into the same file without anyone noticing until review.
