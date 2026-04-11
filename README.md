<p align="center">
  <img src="assets/logo-dark.png" alt="Jaiye Labs" width="320" />
</p>

<h1 align="center">jaiye-agent</h1>

<p align="center">
  Multi-agent coordination for AI coding tools.<br/>
  File ownership. Structured handoffs. Conflict detection.
</p>

<p align="center">
  <a href="#install">Install</a> &middot;
  <a href="#commands">Commands</a> &middot;
  <a href="#how-it-works">How It Works</a> &middot;
  <a href="#ci-integration">CI Integration</a>
</p>

---

Most developers using AI coding agents run into the same problem: multiple agents editing the same files, no coordination, no handoffs, no ownership.

`jaiye-agent` fixes this. It adds a lightweight coordination layer to any repo — track which agent owns which files, create structured handoffs between agents and catch conflicts before they hit production.

Works with any AI coding agent. Claude Code, Codex, Gemini CLI, Cursor, Copilot — doesn't matter. The protocol is agent-agnostic.

---

## Install

```bash
npx jaiye-agent init
```

This creates:
- `.jaiye/config.yaml` — agent definitions and file ownership rules
- `AGENTS.md` — protocol reference for all agents to read
- `.jaiye/handoffs/` — local handoff log directory

## Commands

### `jaiye-agent init`

Scaffold the protocol in your repo.

```bash
jaiye-agent init
```

### `jaiye-agent status`

See which agent owns which files and spot conflicts.

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

## How It Works

### Agent identification

Agents are identified by commit message prefixes. Configure them in `.jaiye/config.yaml`:

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

Then commit with the prefix:

```bash
git commit -m "[claude] add auth flow"
git commit -m "[codex] add auth tests"
```

### File ownership

Define which agent owns which files:

```yaml
ownership:
  - pattern: "src/**"
    agent: claude
  - pattern: "tests/**"
    agent: codex
  - pattern: "docs/**"
    agent: gemini
```

When an agent touches a file it doesn't own, `status` flags it as a conflict.

### Handoffs

Before passing work to another agent, create a handoff:

```bash
jaiye-agent handoff --from claude --to codex --summary "feature done, need tests"
```

This generates a structured markdown file with git context, files touched and status — so the receiving agent knows exactly what happened.

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

## Why

- **80% of developers use AI coding agents** but most have no coordination between them
- **37% of multi-agent failures** come from integration errors — agents editing the same files without knowing
- The fix isn't fewer agents. It's **clear ownership and structured handoffs**

## License

MIT — [Jaiye Labs](https://jaiyelabs.com)
