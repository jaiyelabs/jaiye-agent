import { loadConfig } from '../core/config.js'
import { reserveFiles } from '../core/state.js'
import { success, error, warn, dim } from '../utils/format.js'

export function planCommand(options: { agent?: string, files?: string[], hours?: number }) {
  const config = loadConfig()
  const agent = options.agent
  const files = options.files || []

  if (!agent) {
    console.log(error('Missing required flag: --agent <agent>'))
    process.exit(1)
  }

  const validAgents = config.agents.map(a => a.name)
  if (!validAgents.includes(agent)) {
    console.log(error(`Unknown agent: ${agent}. Valid agents: ${validAgents.join(', ')}`))
    process.exit(1)
  }

  if (files.length === 0) {
    console.log(error('No files provided.'))
    process.exit(1)
  }

  const hours = options.hours ?? 4
  if (!Number.isSafeInteger(hours) || hours <= 0) {
    console.log(error('Invalid hours.'))
    process.exit(1)
  }

  const { blocked } = reserveFiles(agent, files, config, hours)
  const reserved = files.length - blocked.length

  if (reserved > 0) {
    console.log(success(`Reserved ${reserved} file${reserved === 1 ? '' : 's'} as ${agent}`))
  }

  for (const item of blocked) {
    console.log(warn(`Blocked ${item.file}`))
    console.log(dim(`reserved by ${item.reservation.agent} until ${item.reservation.expires_at}`))
  }

  console.log(dim('.jaiye/state.json updated'))

  if (blocked.length > 0) {
    process.exit(1)
  }
}
