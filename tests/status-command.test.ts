import fs from 'fs'
import os from 'os'
import path from 'path'
import { execFileSync } from 'child_process'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { statusCommand } from '../src/commands/status.js'

const cwd = process.cwd()

afterEach(() => {
  process.chdir(cwd)
  vi.restoreAllMocks()
})

function setupState() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jaiye-status-command-'))
  process.chdir(dir)
  fs.mkdirSync('.jaiye')
  fs.writeFileSync(path.join('.jaiye', 'config.yaml'), `
version: 2
agents:
  - name: codex
    description: codex
ownership:
  - pattern: "*.md"
    agent: codex
settings:
  handoff_dir: ".jaiye/handoffs"
  conflict_mode: "warn"
  base_branch: "main"
`)
  fs.writeFileSync('notes.md', 'hello')
  fs.writeFileSync(path.join('.jaiye', 'state.json'), JSON.stringify({
    version: 1,
    files: {},
    reservations: {
      'missing.md': {
        agent: 'codex',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      }
    },
    updated: new Date().toISOString()
  }, null, 2))
}

describe('status command', () => {
  it('shows reserved files missing from state entries', () => {
    setupState()
    const logs: string[] = []
    vi.spyOn(console, 'log').mockImplementation(message => logs.push(String(message)))

    statusCommand()

    expect(logs.join('\n')).toContain('missing.md')
  })

  it('filters to reserved files', () => {
    setupState()
    const logs: string[] = []
    vi.spyOn(console, 'log').mockImplementation(message => logs.push(String(message)))

    statusCommand({ reserved: true })

    const output = logs.join('\n')
    expect(output).toContain('missing.md')
    expect(output).not.toContain('notes.md')
  })

  it('shows all tracked files', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jaiye-status-command-'))
    process.chdir(dir)
    execFileSync('git', ['init'], { stdio: 'ignore' })
    execFileSync('git', ['config', 'user.email', 'codex@example.com'])
    execFileSync('git', ['config', 'user.name', 'Codex'])
    fs.mkdirSync('.jaiye')
    fs.writeFileSync(path.join('.jaiye', 'config.yaml'), `
version: 2
agents:
  - name: codex
    description: codex
ownership:
  - pattern: "*.md"
    agent: codex
settings:
  handoff_dir: ".jaiye/handoffs"
  conflict_mode: "warn"
  base_branch: "main"
`)
    fs.writeFileSync('notes.md', 'hello')
    execFileSync('git', ['add', '.'])
    execFileSync('git', ['commit', '-m', '[codex] first'], { stdio: 'ignore' })

    const logs: string[] = []
    vi.spyOn(console, 'log').mockImplementation(message => logs.push(String(message)))

    statusCommand({ all: true })

    expect(logs.join('\n')).toContain('notes.md')
  })

  it('filters files by agent', () => {
    setupState()
    fs.writeFileSync('other.txt', 'hello')
    const state = JSON.parse(fs.readFileSync(path.join('.jaiye', 'state.json'), 'utf-8'))
    state.files['other.txt'] = {
      assigned: null,
      last_touched_by: 'claude',
      last_modified: new Date().toISOString(),
      artifact_type: 'document'
    }
    fs.writeFileSync(path.join('.jaiye', 'state.json'), JSON.stringify(state, null, 2))

    const logs: string[] = []
    vi.spyOn(console, 'log').mockImplementation(message => logs.push(String(message)))

    statusCommand({ agent: 'codex' })

    const output = logs.join('\n')
    expect(output).toContain('notes.md')
    expect(output).toContain('missing.md')
    expect(output).not.toContain('other.txt')
  })
})
