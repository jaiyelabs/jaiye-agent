import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getRepoRoot, getJaiyeDir, getConfigPath, getHandoffDir, getAgentsMdPath } from '../utils/paths.js'
import { loadConfig } from '../core/config.js'
import { generateAgentsMd } from '../core/agents-md.js'
import { parseYaml } from '../utils/yaml.js'
import { success, warn, dim } from '../utils/format.js'
import type { JaiyeConfig } from '../types.js'

export function initCommand() {
  const root = getRepoRoot()
  const jaiyeDir = getJaiyeDir()
  const configPath = getConfigPath()
  const handoffDir = getHandoffDir()
  const agentsMdPath = getAgentsMdPath()

  // check if already initialized
  if (fs.existsSync(configPath)) {
    console.log(warn('Already initialized. .jaiye/config.yaml exists.'))
    console.log(dim('To reinitialize, delete .jaiye/ and run init again.'))
    return
  }

  // create .jaiye directory
  fs.mkdirSync(jaiyeDir, { recursive: true })
  fs.mkdirSync(handoffDir, { recursive: true })

  // copy default config
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const templateDir = path.resolve(__dirname, '..', 'templates')

  // try bundled templates, fall back to project templates
  let configTemplate: string
  const bundledConfig = path.join(templateDir, 'config.yaml')
  const projectConfig = path.resolve(__dirname, '..', '..', 'templates', 'config.yaml')

  if (fs.existsSync(bundledConfig)) {
    configTemplate = fs.readFileSync(bundledConfig, 'utf-8')
  } else if (fs.existsSync(projectConfig)) {
    configTemplate = fs.readFileSync(projectConfig, 'utf-8')
  } else {
    // inline fallback
    configTemplate = `version: 1

agents:
  - name: claude
    description: "Primary architect — complex features, refactoring"
    commit_prefix: "[claude]"
  - name: codex
    description: "Integration, debugging, validation"
    commit_prefix: "[codex]"
  - name: gemini
    description: "Routine tasks, documentation, research"
    commit_prefix: "[gemini]"

ownership:
  - pattern: "src/**"
    agent: claude
  - pattern: "tests/**"
    agent: codex
  - pattern: "docs/**"
    agent: gemini

settings:
  handoff_dir: ".jaiye/handoffs"
  conflict_mode: "warn"
  base_branch: "main"
`
  }

  fs.writeFileSync(configPath, configTemplate)

  // generate AGENTS.md
  const config = parseYaml<JaiyeConfig>(configTemplate)
  const agentsMd = generateAgentsMd(config)
  fs.writeFileSync(agentsMdPath, agentsMd)

  console.log(success('Initialized jaiye-agent'))
  console.log()
  console.log(`  ${dim('Config:')}   .jaiye/config.yaml`)
  console.log(`  ${dim('Agents:')}   AGENTS.md`)
  console.log(`  ${dim('Handoffs:')} .jaiye/handoffs/`)
  console.log()
  console.log(dim('Next: edit .jaiye/config.yaml to match your project structure.'))
  console.log(dim('Consider adding .jaiye/handoffs/ to .gitignore.'))
}
