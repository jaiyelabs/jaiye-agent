import { loadConfig } from '../core/config.js'
import { releaseAllFiles, releaseFiles } from '../core/state.js'
import { success, error, dim } from '../utils/format.js'

export function releaseCommand(options: { agent?: string, files?: string[], all?: boolean }) {
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

  if (files.length === 0 && !options.all) {
    console.log(error('No files provided.'))
    process.exit(1)
  }

  const released = options.all ? releaseAllFiles(agent) : releaseFiles(agent, files)

  console.log(success(`Released ${released} file${released === 1 ? '' : 's'}`))
  console.log(dim('.jaiye/state.json updated'))
}
