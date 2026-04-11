<p align="center">
  <img src="assets/logo-dark.png" alt="Jaiye Labs" width="320" />
</p>

<h1 align="center">jaiye-agent</h1>

<p align="center">
  The coordination layer for multi-agent coding workflows.<br/>
  File ownership. Structured handoffs. Conflict detection.
</p>

<p align="center">
  <a href="#install">Install</a> &middot;
  <a href="#commands">Commands</a> &middot;
  <a href="#how-it-works">How It Works</a> &middot;
  <a href="#ci-integration">CI Integration</a>
</p>

---

## The Problem

Most teams are **agent-rich but strategy-poor.** They have Claude Code, Codex, Gemini CLI, Cursor and Copilot — but no coordination between them. The result: agents editing the same files, undoing each other's work and burning tokens re-learning context that was already discovered.

**37% of multi-agent failures** come from integration errors — agents working in isolation that produce correct code individually but break at the seam.

## The Fix

`jaiye-agent` adds a shared memory bus to your repo. It tracks which agent owns which files, creates structured handoffs when work passes between agents and catches conflicts before they hit production.

It's not a platform. It's not a dashboard. It lives inside your repo — invisible orchestration that works with the tools you already use.

---

## Install

```bash
npx jaiye-agent init
```

This creates:
- `.jaiye/config.yaml` — agent definitions and file ownership rules
- `AGENTS.md` — the shared state file all agents read before starting work
- `.jaiye/handoffs/` — local handoff log directory

---

## Commands

### `jaiye-agent init`

Scaffold the protocol in your repo.

```bash
jaiye-agent init
```

### `jaiye-agent status`

See which agent owns which files and spot conflicts instantly.

```
jaiye-agent status

┌──────────────────┬──────────┬─────────────────┬──────────┐
│ File             │ Assigned │ Last Touched By │ Status   │
├──────────────────┼──────────┼─────────────────┼──────────┤
│ src/app.ts       │ claude   │ claude          │ ok       │
├──────────────────┼──────────┼─────────────────┼──────────┤
│ src/auth.ts      │ claude   │ codex           │ CONFLICT │
├──────────────────┼──────────┼─────────────────┼──────────┤
│ tests/app.test.ts│ codex    │ codex           │ ok       │
└──────────────────┴──────────┴─────────────────┴──────────┘
```

### `jaiye-agent handoff`

Create a structured handoff between agents, pre-filled from git state.

```bash
jaiye-agent handoff --from claude --to codex --summary "auth flow done, need tests"
```

### `jaiye-agent log`

View handoff history.

```bash
jaiye-agent log
```

### `jaiye-agent check`

CI mode. Exits with code 1 if multiple agents touched the same file in a PR.

```bash
jaiye-agent check --base main
```

---

## How It Works

### Role specialization

Each agent has a defined role. You're not asking them to do the same thing — you're letting each one play to its strengths.

| Agent | Role | Commit Prefix |
|-------|------|---------------|
| Claude Code | Architecture, complex features, refactoring | `[claude]` |
| Codex | Integration, debugging, validation | `[codex]` |
| Gemini CLI | Routine tasks, documentation, research | `[gemini]` |

Configure agents in `.jaiye/config.yaml`:

```yaml
agents:
  - name: claude
    description: "Primary architect"
    commit_prefix: "[claude]"
  - name: codex
    description: "Integration and testing"
    commit_prefix: "[codex]"
  - name: gemini
    description: "Routine tasks"
    commit_prefix: "[gemini]"
```

### File ownership

Define which agent owns which files. When an agent crosses a boundary, `status` flags it.

```yaml
ownership:
  - pattern: "src/**"
    agent: claude
  - pattern: "tests/**"
    agent: codex
  - pattern: "docs/**"
    agent: gemini
```

### The handoff protocol

Before passing work to another agent:

1. Commit and push all changes
2. Run `jaiye-agent handoff --from <you> --to <next-agent>`
3. The receiving agent reads the handoff before starting

The handoff includes git context, files touched, current status, assumptions and an exact ask — zero loss of momentum between agents.

### Context preservation

`AGENTS.md` acts as a save point for the whole team. If an agent discovers something non-obvious — a gotcha, a constraint, a decision — it goes in the file so the next agent doesn't re-learn it.

---

## CI Integration

Add to your GitHub Actions workflow:

```yaml
name: Agent Check
on: [pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: jaiyelabs/jaiye-agent@v1
        with:
          base_branch: main
```

Or run directly:

```bash
npx jaiye-agent check --base main
```

---

## Configuration

Full `.jaiye/config.yaml` reference:

```yaml
version: 1

agents:
  - name: claude
    description: "Primary architect"
    commit_prefix: "[claude]"

ownership:
  - pattern: "src/**"
    agent: claude

settings:
  handoff_dir: ".jaiye/handoffs"
  conflict_mode: "warn"       # "warn" or "error"
  base_branch: "main"
```

---

## Why This Works

**Role specialization** — you're not asking agents to do the same thing. Each one plays to its training strengths.

**Context preservation** — `AGENTS.md` keeps discoveries in the active attention window instead of losing them 20 messages ago.

**Frictionless handoffs** — the "Mode" field tells the receiving agent exactly how much to touch. "Integrate" is different from "Draft."

**Agent-agnostic** — works with Claude Code, Codex, Gemini CLI, Cursor, Copilot or any combination. The protocol is the product, not the agents.

---

## License

MIT — [Jaiye Labs](https://jaiyelabs.com)
