import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { planCommand } from './plan.js'

const cwd = process.cwd()

afterEach(() => {
  process.chdir(cwd)
  vi.restoreAllMocks()
})

describe('plan', () => {
  it('rejects invalid hours', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jaiye-plan-'))
    process.chdir(dir)
    fs.mkdirSync('.jaiye')
    fs.writeFileSync(path.join('.jaiye', 'config.yaml'), [
      'version: 2',
      'agents:',
      '  - name: codex',
      '    description: codex',
      'ownership:',
      '  - pattern: "*.md"',
      '    agent: codex',
      'settings:',
      '  handoff_dir: ".jaiye/handoffs"',
      '  conflict_mode: warn',
      '  base_branch: main'
    ].join('\n'))

    const logs: string[] = []
    vi.spyOn(console, 'log').mockImplementation(message => logs.push(String(message)))
    vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit')
    }) as never)

    expect(() => planCommand({ agent: 'codex', files: ['notes.md'], hours: Number.NaN })).toThrow('exit')
    expect(logs[0]).toContain('Invalid hours.')
    expect(fs.existsSync(path.join('.jaiye', 'state.json'))).toBe(false)
  })

  it('rejects fractional direct hours', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jaiye-plan-'))
    process.chdir(dir)
    fs.mkdirSync('.jaiye')
    fs.writeFileSync(path.join('.jaiye', 'config.yaml'), [
      'version: 2',
      'agents:',
      '  - name: codex',
      '    description: codex',
      'ownership:',
      '  - pattern: "*.md"',
      '    agent: codex',
      'settings:',
      '  handoff_dir: ".jaiye/handoffs"',
      '  conflict_mode: warn',
      '  base_branch: main'
    ].join('\n'))

    const logs: string[] = []
    vi.spyOn(console, 'log').mockImplementation(message => logs.push(String(message)))
    vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit')
    }) as never)

    expect(() => planCommand({ agent: 'codex', files: ['notes.md'], hours: 0.5 })).toThrow('exit')
    expect(logs[0]).toContain('Invalid hours.')
    expect(fs.existsSync(path.join('.jaiye', 'state.json'))).toBe(false)
  })

  it('exits when a file is already reserved by another agent', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jaiye-plan-'))
    process.chdir(dir)
    fs.mkdirSync('.jaiye')
    fs.writeFileSync('notes.md', 'hello')
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

    const logs: string[] = []
    vi.spyOn(console, 'log').mockImplementation(message => logs.push(String(message)))
    vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit')
    }) as never)

    planCommand({ agent: 'codex', files: ['notes.md'], hours: 1 })

    expect(() => planCommand({ agent: 'claude', files: ['notes.md'], hours: 1 })).toThrow('exit')
    expect(logs.some(line => line.includes('Blocked notes.md'))).toBe(true)
  })
})
