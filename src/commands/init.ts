import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getJaiyeDir, getConfigPath, getHandoffDir, getAgentsMdPath, getBridgeDir } from '../utils/paths.js'
import { detectMode, detectProjectType, getProjectRoot } from '../core/mode.js'
import { generateAgentsMd } from '../core/agents-md.js'
import { parseYaml } from '../utils/yaml.js'
import { success, warn, dim } from '../utils/format.js'
import type { JaiyeConfig, OwnershipRule } from '../types.js'

export function initCommand(options: { scan?: boolean } = {}) {
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

  if (options.scan) {
    const rules = scanOwnership(root, projectType)
    configTemplate = replaceOwnership(configTemplate, rules)
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
  if (options.scan) {
    console.log(`  ${dim('Scan:')}     ownership inferred from project files`)
  }
  console.log()
  console.log(dim(options.scan
    ? 'Next: review .jaiye/config.yaml before using it in CI.'
    : 'Next: edit .jaiye/config.yaml to match your project structure.'))
  if (mode === 'git') {
    console.log(dim('Consider adding .jaiye/handoffs/ to .gitignore.'))
  }
}

export function scanOwnership(root: string, projectType: string): OwnershipRule[] {
  const entries = new Set(listProjectEntries(root))
  const rules: OwnershipRule[] = []

  const add = (pattern: string, agent: string, artifact_type?: string) => {
    if (!rules.some(rule => rule.pattern === pattern)) {
      rules.push({ pattern, agent, ...(artifact_type ? { artifact_type } : {}) })
    }
  }

  if (entries.has('src')) add('src/**', 'claude', 'code')
  if (entries.has('app')) add('app/**', 'claude', 'code')
  if (entries.has('lib')) add('lib/**', 'claude', 'code')
  if (entries.has('components')) add('components/**', 'codex', 'code')
  if (entries.has('pages')) add('pages/**', 'claude', 'code')
  if (entries.has('api')) add('api/**', 'claude', 'code')
  if (entries.has('scripts')) add('scripts/**', 'codex', 'code')
  if (entries.has('tests')) add('tests/**', 'codex', 'code')
  if (entries.has('__tests__')) add('__tests__/**', 'codex', 'code')
  if (entries.has('docs')) add('docs/**', 'gemini', 'document')
  if (entries.has('README.md')) add('README.md', 'gemini', 'document')

  if (projectType === 'media') {
    add('*.mov', 'cowork', 'media')
    add('*.mp4', 'cowork', 'media')
    add('*.mp3', 'cowork', 'media')
    add('*.wav', 'cowork', 'media')
  } else if (projectType === 'content' || projectType === 'mixed') {
    add('*.md', 'gemini', 'document')
    add('*.docx', 'cowork', 'document')
    add('*.xlsx', 'cowork', 'data')
    add('*.csv', 'cowork', 'data')
  }

  return rules.length > 0 ? rules : [
    { pattern: 'src/**', agent: 'claude' },
    { pattern: 'tests/**', agent: 'codex' },
    { pattern: 'docs/**', agent: 'gemini' }
  ]
}

function replaceOwnership(configTemplate: string, rules: OwnershipRule[]) {
  const yaml = [
    'ownership:',
    ...rules.map(rule => {
      const lines = [
        `  - pattern: "${rule.pattern}"`,
        `    agent: ${rule.agent}`
      ]
      if (rule.artifact_type) lines.push(`    artifact_type: ${rule.artifact_type}`)
      return lines.join('\n')
    })
  ].join('\n')

  return configTemplate.replace(/ownership:\n(?:  - .+\n(?:    .+\n)*)+/, `${yaml}\n`)
}

function listProjectEntries(root: string) {
  const ignored = new Set(['.git', 'node_modules', 'dist', '.jaiye'])
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(root, { withFileTypes: true })
  } catch {
    return []
  }

  return entries
    .filter(entry => !ignored.has(entry.name))
    .map(entry => entry.name)
}
