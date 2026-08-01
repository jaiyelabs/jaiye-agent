<p align="center">
  <img src="assets/logo-dark.png" alt="Jaiye Labs" width="320" />
</p>

<h1 align="center">jaiye-agent</h1>

<p align="center">
  Repo-native coordination for AI coding agents that do not share a runtime.<br/>
  File ownership. Structured handoffs. CI-ready conflict detection.
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

Agents working in isolation can produce correct code individually and still break when their work meets the rest of the repo.

## The Fix

`jaiye-agent` gives Claude Code, Codex, Gemini CLI, Cursor and other tools a common protocol for file ownership, structured handoffs, same-file conflict checks and shared project context.

It's not a hosted platform. It's not a replacement for the tools you already use. It lives inside your repo.

---

## Install

```bash
npx jaiye-agent init --scan
```

This creates:
- `.jaiye/config.yaml` — agent definitions and file ownership rules
- `AGENTS.md` — the shared state file all agents read before starting work
- `.jaiye/handoffs/` — local handoff log directory

`--scan` infers first-pass ownership rules from your project folders and files. Review them before turning on CI.

## 30-Second Flow

```bash
jaiye-agent init --scan
jaiye-agent plan --agent claude src/auth.ts
jaiye-agent touch --agent claude src/auth.ts
jaiye-agent handoff --from claude --to codex --summary "auth flow done, need tests"
jaiye-agent check --base main
```

That gives each tool a shared project protocol before it starts editing, records which agent touched what and catches same-file collisions before the PR merges.

---

## Commands

### `jaiye-agent init`

Scaffold the protocol in your repo.

```bash
jaiye-agent init --scan
```

Use plain `jaiye-agent init` if you want to start from the default ownership map.

### `jaiye-agent status`

See which agent owns which files and spot conflicts instantly.

Alias: `jaiye-agent ls`

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

Alias: `jaiye-agent history`

```bash
jaiye-agent log
```

### `jaiye-agent check`

CI mode. Exits with code 1 if multiple agents touched the same file in a PR.

```bash
jaiye-agent check --base main
```

### `jaiye-agent sync`

Rebuild `.jaiye/state.json` from the filesystem.

Alias: `jaiye-agent refresh`

```bash
jaiye-agent sync
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

Git handles same-line merge conflicts. `jaiye-agent check` catches an earlier signal: two agents touched the same file in the same PR window, even when git can merge the lines cleanly.

Minimal setup:

```yaml
- uses: actions/checkout@v4
- uses: jaiyelabs/jaiye-agent@v1
```

Full setup:

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

## Dogfood Case

In this repo, `src/**` is owned by Claude, `tests/**` by Codex and `docs/**` by Gemini. If Claude and Codex both touch `src/core/git.ts` in the same PR window, `jaiye-agent check --base main` reports the file as a conflict before merge time.

That is the core job: catch same-file, different-agent drift while the work is still cheap to coordinate.

## Services

Jaiye Labs can set this up for teams already using Claude Code, Codex, Cursor, Aider or Gemini CLI:

- agent role design
- `.jaiye/config.yaml` ownership map
- CI conflict gate
- handoff protocol
- audit trail for agent-touched files

Typical setup: $5k-$25k depending on repo count, team size and CI complexity.

---

## Configuration

See [docs/config-spec.md](docs/config-spec.md) for the config format. Minimal example:

```yaml
version: 2

project:
  name: "my-project"
  type: "code"

agents:
  - name: claude
    description: "Primary architect"
    type: cli
    capabilities: [code_gen, file_io, git]
    commit_prefix: "[claude]"

ownership:
  - pattern: "src/**"
    agent: claude
    artifact_type: code

settings:
  handoff_dir: ".jaiye/handoffs"
  bridge_dir: ".jaiye/bridges"
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
