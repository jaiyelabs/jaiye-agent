import { loadConfig } from '../core/config.js'
import { detectConflicts } from '../core/ownership.js'
import { getFilesInPR, getCommitsInPR, identifyAgent } from '../core/git.js'
import { heading, success, error, dim, warn } from '../utils/format.js'

export function checkCommand(options: { base?: string }) {
  const config = loadConfig()
  const baseBranch = options.base || config.settings.base_branch

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
