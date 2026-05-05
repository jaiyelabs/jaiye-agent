import { loadConfig } from '../core/config.js'
import { touchFiles } from '../core/state.js'
import { success, error, dim } from '../utils/format.js'

export function touchCommand(options: { agent?: string, files?: string[] }) {
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

  touchFiles(agent, files, config)

  console.log(success(`Touched ${files.length} file${files.length > 1 ? 's' : ''} as ${agent}`))
  console.log(dim('.jaiye/state.json updated'))
}
