import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getJaiyeDir, getConfigPath, getHandoffDir, getAgentsMdPath, getBridgeDir } from '../utils/paths.js'
import { detectMode, detectProjectType, getProjectRoot } from '../core/mode.js'
import { generateAgentsMd } from '../core/agents-md.js'
import { parseYaml } from '../utils/yaml.js'
import { success, warn, dim } from '../utils/format.js'
import type { JaiyeConfig } from '../types.js'

export function initCommand() {
  const root = getProjectRoot()
  const mode = detectMode()
  const projectType = detectProjectType(root)
  const jaiyeDir = getJaiyeDir()
  const configPath = getConfigPath()
  const handoffDir = getHandoffDir()
  const bridgeDir = getBridgeDir()
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
  fs.mkdirSync(bridgeDir, { recursive: true })

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
    configTemplate = `version: 2

project:
  name: "${path.basename(root)}"
  type: "${projectType}"

agents:
  - name: claude
    description: "Primary architect — complex features, refactoring"
    type: cli
    capabilities: [code_gen, file_io, git]
    commit_prefix: "[claude]"
  - name: codex
    description: "Integration, debugging, validation"
    type: cli
    capabilities: [code_gen, file_io, reasoning]
    commit_prefix: "[codex]"
    bridge: ".jaiye/bridges/bridge.md"
  - name: cowork
    description: "Production operations, documents, research"
    type: desktop
    capabilities: [file_io, mcp, document_gen, web_search]
    bridge: ".jaiye/bridges/bridge.md"
  - name: gemini
    description: "Routine tasks, documentation, research"
    type: cli
    capabilities: [code_gen, file_io, research]
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
  bridge_dir: ".jaiye/bridges"
  conflict_mode: "warn"
  base_branch: "main"
`
  }

  if (fs.existsSync(bundledConfig) || fs.existsSync(projectConfig)) {
    configTemplate = configTemplate.replace('version: 1', 'version: 2')

    if (configTemplate.includes('project:')) {
      configTemplate = configTemplate
        .replace(/name: "my-project"/, `name: "${path.basename(root)}"`)
        .replace(/type: "code"/, `type: "${projectType}"`)
    } else {
      configTemplate = configTemplate
        .replace('agents:', `project:\n  name: "${path.basename(root)}"\n  type: "${projectType}"\n\nagents:`)
    }
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
  console.log(`  ${dim('Mode:')}     ${mode}`)
  console.log(`  ${dim('Type:')}     ${projectType}`)
  console.log()
  console.log(dim('Next: edit .jaiye/config.yaml to match your project structure.'))
  if (mode === 'git') {
    console.log(dim('Consider adding .jaiye/handoffs/ to .gitignore.'))
  }
}
