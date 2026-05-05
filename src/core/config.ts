import fs from 'fs'
import type { JaiyeConfig } from '../types.js'
import { getConfigPath } from '../utils/paths.js'
import { parseYaml } from '../utils/yaml.js'

export function configExists(): boolean {
  return fs.existsSync(getConfigPath())
}

export function loadConfig(): JaiyeConfig {
  const configPath = getConfigPath()

  if (!fs.existsSync(configPath)) {
    throw new Error('No .jaiye/config.yaml found. Run `jaiye-agent init` first.')
  }

  const raw = fs.readFileSync(configPath, 'utf-8')
  const config = parseYaml<JaiyeConfig>(raw)

  if (!config.agents || !Array.isArray(config.agents)) {
    throw new Error('Invalid config: missing agents array')
  }

  if (!config.ownership || !Array.isArray(config.ownership)) {
    throw new Error('Invalid config: missing ownership array')
  }

  // defaults
  const settings = (config.settings || {}) as Partial<JaiyeConfig['settings']>
  config.settings = {
    handoff_dir: '.jaiye/handoffs',
    conflict_mode: 'warn',
    base_branch: 'main',
    bridge_dir: '.jaiye/bridges',
    ...settings
  }

  config.agents = config.agents.map(agent => ({
    type: 'cli',
    capabilities: ['code_gen', 'file_io', 'git'],
    ...agent
  }))

  return config
}
