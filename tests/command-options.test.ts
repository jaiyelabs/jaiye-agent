import fs from 'fs'
import os from 'os'
import path from 'path'
import { describe, expect, it, vi } from 'vitest'
import { parseAgent, program } from '../src/index.js'

describe('command options', () => {
  it('rejects agent names that cannot be used in handoff filenames', () => {
    expect(() => parseAgent('claude:code')).toThrow('must be a valid agent')
    expect(() => parseAgent('codex|cli')).toThrow('must be a valid agent')
  })

  it('shows a handoff example in command help', () => {
    const command = program.commands.find(command => command.name() === 'handoff')
    let output = ''
    command?.configureOutput({ writeOut: text => { output += text } })

    command?.outputHelp()
    expect(output).toContain('jaiye-agent handoff --from claude --to codex')
  })

  it('rejects reservation hours that produce an invalid date', () => {
    const command = program.commands.find(command => command.name() === 'plan')
    const option = command?.options.find(option => option.long === '--hours')

    expect(() => option?.parseArg?.('9007199254740991', undefined)).toThrow('must be a valid reservation length')
    expect(option?.parseArg?.('4', undefined)).toBe(4)
  })

  it('accepts the short option for bridge archive age', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jaiye-archive-option-'))
    const file = path.join(dir, 'bridge.md')
    fs.writeFileSync(file, `# Bridge

### CODEX - 2000-01-01T00:00:00.000Z

Old message

DONE: finished
`)
    const command = program.commands.find(command => command.name() === 'bridge')
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    try {
      command?.parse(['--archive', '-O', '12h', '--file', file], { from: 'user' })
      expect(fs.readFileSync(path.join(dir, 'bridge_archive.md'), 'utf-8')).toContain('Old message')
      expect(fs.readFileSync(file, 'utf-8')).not.toContain('Old message')
    } finally {
      log.mockRestore()
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
})
