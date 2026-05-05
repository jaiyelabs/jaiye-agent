import { loadConfig } from '../core/config.js'
import { detectConflicts } from '../core/ownership.js'
import { getFilesInPR, getCommitsInPR, identifyAgent } from '../core/git.js'
import { detectMode } from '../core/mode.js'
import { stateEntries } from '../core/state.js'
import { heading, success, error, dim, warn } from '../utils/format.js'

export function checkCommand(options: { base?: string }) {
  const config = loadConfig()
  const baseBranch = options.base || config.settings.base_branch
  const mode = detectMode()

  if (mode === 'standalone') {
    const conflicts = stateEntries(config).filter(entry =>
      entry.assigned !== null &&
      entry.last_touched_by !== null &&
      entry.assigned !== entry.last_touched_by
    )

    console.log(heading('jaiye-agent check'))
    console.log()
    console.log(dim('Checking file ownership from .jaiye/state.json'))
    console.log()

    if (conflicts.length === 0) {
      console.log(success('No ownership conflicts found.'))
      process.exit(0)
    }

    for (const conflict of conflicts) {
      console.log(error(`CONFLICT  ${conflict.file}`))
      console.log(`  - ${dim(`assigned: ${conflict.assigned}`)} touched by ${conflict.last_touched_by}`)
    }

    console.log()
    console.log(error(`${conflicts.length} conflict${conflicts.length > 1 ? 's' : ''} found.`))
    process.exit(1)
  }

  const files = getFilesInPR(baseBranch)
  const commits = getCommitsInPR(baseBranch)

  if (files.length === 0) {
    console.log(dim('No files changed in this PR.'))
    process.exit(0)
  }

  console.log(heading('jaiye-agent check'))
  console.log()
  console.log(dim(`Checking file ownership (${baseBranch}...HEAD)`))
  console.log()

  const conflicts = detectConflicts(files, commits, config)

  if (conflicts.length === 0) {
    console.log(success('No ownership conflicts found.'))
    process.exit(0)
  }

  for (const conflict of conflicts) {
    console.log(error(`CONFLICT  ${conflict.file}`))
    for (const commit of conflict.commits) {
      const agent = identifyAgent(commit, config.agents) || 'unknown'
      console.log(`  - ${dim(`[${agent}]`)} ${commit.hash.slice(0, 7)}: ${commit.message}`)
    }
    console.log()
  }

  console.log(error(`${conflicts.length} conflict${conflicts.length > 1 ? 's' : ''} found.`))
  console.log(dim('Each file should be owned by one agent per PR.'))
  console.log(dim('Fix: coordinate handoffs or update .jaiye/config.yaml ownership rules.'))

  process.exit(1)
}
