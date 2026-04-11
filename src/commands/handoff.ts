import { loadConfig } from '../core/config.js'
import { createHandoff } from '../core/handoffs.js'
import { getCurrentBranch, getRecentCommits, getFilesChangedSince } from '../core/git.js'
import { success, dim, error } from '../utils/format.js'
import type { Handoff } from '../types.js'

export function handoffCommand(options: { from?: string, to?: string, summary?: string }) {
  const config = loadConfig()

  const { from, to, summary } = options

  if (!from || !to) {
    console.log(error('Missing required flags: --from <agent> --to <agent>'))
    process.exit(1)
  }

  const validAgents = config.agents.map(a => a.name)
  if (!validAgents.includes(from)) {
    console.log(error(`Unknown agent: ${from}. Valid agents: ${validAgents.join(', ')}`))
    process.exit(1)
  }
  if (!validAgents.includes(to)) {
    console.log(error(`Unknown agent: ${to}. Valid agents: ${validAgents.join(', ')}`))
    process.exit(1)
  }

  const now = new Date()
  const id = now.toISOString().replace(/[-:T]/g, '').slice(0, 12)
  const branch = getCurrentBranch()
  const files = getFilesChangedSince('HEAD~5')

  const handoff: Handoff = {
    id,
    from,
    to,
    timestamp: now.toISOString(),
    branch,
    status: 'clean',
    summary: summary || `Handoff from ${from} to ${to}`,
    files_touched: files,
    notes: ''
  }

  const filepath = createHandoff(handoff)

  console.log(success(`Handoff created: ${from} → ${to}`))
  console.log()
  console.log(`  ${dim('File:')}   ${filepath}`)
  console.log(`  ${dim('Branch:')} ${branch}`)
  console.log(`  ${dim('Files:')}  ${files.length} changed`)
  console.log()
  console.log(dim(`Edit the handoff file to add notes before passing to ${to}.`))
}
