import { loadConfig } from '../core/config.js'
import { resolveOwnership } from '../core/ownership.js'
import { getFilesChangedSince } from '../core/git.js'
import { heading, success, warn, error, dim, createTable } from '../utils/format.js'

export function statusCommand() {
  const config = loadConfig()
  const files = getFilesChangedSince('HEAD~10')

  if (files.length === 0) {
    console.log(dim('No recent file changes found.'))
    return
  }

  const entries = resolveOwnership(files, config)

  console.log(heading('jaiye-agent status'))
  console.log()

  const table = createTable(['File', 'Assigned', 'Last Touched By', 'Status'])

  let conflictCount = 0

  for (const entry of entries) {
    const assigned = entry.assigned_agent || dim('unassigned')
    const touched = entry.last_touched_by || dim('unknown')
    const status = entry.conflict ? error('CONFLICT') : success('ok')

    if (entry.conflict) conflictCount++

    table.push([entry.file, assigned, touched, status])
  }

  console.log(table.toString())
  console.log()

  if (conflictCount > 0) {
    console.log(warn(`${conflictCount} conflict${conflictCount > 1 ? 's' : ''} found.`))
    console.log(dim('Files are being touched by agents other than their assigned owner.'))
  } else {
    console.log(success('No conflicts.'))
  }
}
