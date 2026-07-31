import { loadConfig } from '../core/config.js'
import { findOwner, resolveOwnership } from '../core/ownership.js'
import { getFilesChangedSince } from '../core/git.js'
import { detectMode } from '../core/mode.js'
import { activeReservations, stateEntries } from '../core/state.js'
import { heading, success, warn, error, dim, createTable } from '../utils/format.js'

export function statusCommand(options: { reserved?: boolean } = {}) {
  const config = loadConfig()
  const mode = detectMode()
  const reservations = activeReservations()
  const reservedFiles = Object.keys(reservations)
  const state = mode === 'git' ? [] : stateEntries(config)
  const files = mode === 'git'
    ? getFilesChangedSince('HEAD~10')
    : state.map(entry => entry.file)
  const allFiles = [...new Set([...files, ...reservedFiles])].sort()
  const shownFiles = options.reserved
    ? allFiles.filter(file => reservations[file])
    : allFiles

  if (shownFiles.length === 0) {
    console.log(dim(options.reserved ? 'No active reservations found.' : 'No recent file changes found.'))
    return
  }

  const entries = mode === 'git'
    ? resolveOwnership(shownFiles, config)
    : shownFiles.map(file => {
      const entry = state.find(entry => entry.file === file)
      const assigned = entry ? entry.assigned : findOwner(file, config)
      const touched = entry ? entry.last_touched_by : null
      return {
        file,
        assigned_agent: assigned,
        last_touched_by: touched,
        conflict: assigned !== null && touched !== null && assigned !== touched
      }
    })

  console.log(heading('jaiye-agent status'))
  console.log()

  const table = createTable(['File', 'Assigned', 'Last Touched By', 'Reserved', 'Status'])

  let conflictCount = 0

  for (const entry of entries) {
    const assigned = entry.assigned_agent || dim('unassigned')
    const touched = entry.last_touched_by || dim('unknown')
    const reservation = reservations[entry.file]
    const reserved = reservation ? `${reservation.agent} until ${reservation.expires_at}` : dim('none')
    const status = entry.conflict ? error('CONFLICT') : success('ok')

    if (entry.conflict) conflictCount++

    table.push([entry.file, assigned, touched, reserved, status])
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
