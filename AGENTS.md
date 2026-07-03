# AGENTS.md — Multi-Agent Coordination

This file defines the collaboration protocol for AI coding agents working on this repo.
All agents should read this file before starting work.

## Active Agents

| Agent | Role | Commit Prefix |
|-------|------|---------------|
| claude | Primary architect — complex features, refactoring | `[claude]` |
| codex | Integration, debugging, validation | `[codex]` |
| gemini | Routine tasks, documentation, research | `[gemini]` |

## Commit Convention

All commits must include the agent prefix:

```
[agent-name] short description of change
```

## Handoff Protocol

Before passing work to another agent:
1. Commit and push all changes
2. Run `jaiye-agent handoff --from <you> --to <next-agent>`
3. The receiving agent should read the latest handoff before starting

## Rules

1. **One owner per file** — each file has one assigned agent. Check `.jaiye/config.yaml`.
2. **Handoff before crossing boundaries** — if you need to edit a file owned by another agent, create a handoff first.
3. **Prefix your commits** — always include your agent prefix so ownership tracking works.
4. **Check status before starting** — run `jaiye-agent status` to see if there are any conflicts.

## Project Context

<!-- Add project-specific context here that all agents need to know -->

## Codex Autonomy Contract

Codex should default to working, not waiting:
- Read the repo and local instructions before acting.
- Choose tools without asking when the action is within the current task and safe.
- Run available tests, lint or builds before reporting work complete.
- Verify browser, simulator, emulator or device flows when the task changes UI, mobile, runtime behavior or recording.
- Run one unblock pass before saying blocked.
- Use the repo handoff rules before crossing ownership boundaries.
- Ask only for business calls, missing assets, credentials, destructive git, production data, billing, auth or scope changes that alter the requested outcome.
