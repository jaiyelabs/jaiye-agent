import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { releaseCommand } from './release.js'
import { reserveFiles } from '../core/state.js'
import type { JaiyeConfig } from '../types.js'

const cwd = process.cwd()

afterEach(() => {
  process.chdir(cwd)
  vi.restoreAllMocks()
})

describe('release', () => {
  it('releases all files for an agent', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jaiye-release-'))
    process.chdir(dir)
    fs.mkdirSync('.jaiye')
    fs.writeFileSync(path.join('.jaiye', 'config.yaml'), [
      'version: 2',
      'agents:',
      '  - name: codex',
      '    description: codex',
      '  - name: claude',
      '    description: claude',
      'ownership:',
      '  - pattern: "*.md"',
      '    agent: codex',
      'settings:',
      '  handoff_dir: ".jaiye/handoffs"',
      '  conflict_mode: warn',
      '  base_branch: main'
    ].join('\n'))

    const config: JaiyeConfig = {
      version: 2,
      agents: [{ name: 'codex', description: 'codex' }, { name: 'claude', description: 'claude' }],
      ownership: [{ pattern: '*.md', agent: 'codex' }],
      settings: {
        handoff_dir: '.jaiye/handoffs',
        conflict_mode: 'warn',
        base_branch: 'main'
      }
    }

    reserveFiles('codex', ['a.md', 'b.md'], config)
    reserveFiles('claude', ['c.md'], config)

    const logs: string[] = []
    vi.spyOn(console, 'log').mockImplementation(message => logs.push(String(message)))

    releaseCommand({ agent: 'codex', files: [], all: true })

    const state = JSON.parse(fs.readFileSync(path.join('.jaiye', 'state.json'), 'utf-8'))
    expect(state.reservations['a.md']).toBeUndefined()
    expect(state.reservations['b.md']).toBeUndefined()
    expect(state.reservations['c.md'].agent).toBe('claude')
    expect(logs[0]).toContain('Released 2 files')
  })
})
