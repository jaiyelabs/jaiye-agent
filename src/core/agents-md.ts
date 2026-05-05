import type { JaiyeConfig } from '../types.js'

export function generateAgentsMd(config: JaiyeConfig): string {
  const agentRows = config.agents
    .map(a => `| ${a.name} | ${a.type || 'cli'} | ${a.description} | ${a.capabilities?.join(', ') || ''} | ${a.commit_prefix ? `\`${a.commit_prefix}\`` : 'n/a'} |`)
    .join('\n')

  return `# AGENTS.md — Multi-Agent Coordination

This file defines the collaboration protocol for AI coding agents working on this repo.
All agents should read this file before starting work.

## Active Agents

| Agent | Type | Role | Capabilities | Commit Prefix |
|-------|------|------|--------------|---------------|
${agentRows}

## Commit Convention

All commits must include the agent prefix:

\`\`\`
[agent-name] short description of change
\`\`\`

Standalone projects can use \`jaiye-agent touch --agent <agent> <files...>\` instead of commit prefixes.

## Handoff Protocol

Before passing work to another agent:
1. Commit and push all changes
2. Run \`jaiye-agent handoff --from <you> --to <next-agent>\`
3. The receiving agent should read the latest handoff before starting

## Rules

1. **One owner per file** — each file has one assigned agent. Check \`.jaiye/config.yaml\`.
2. **Handoff before crossing boundaries** — if you need to edit a file owned by another agent, create a handoff first.
3. **Prefix your commits** — always include your agent prefix so ownership tracking works.
4. **Check status before starting** — run \`jaiye-agent status\` to see if there are any conflicts.

## Project Context

<!-- Add project-specific context here that all agents need to know -->
`
}
