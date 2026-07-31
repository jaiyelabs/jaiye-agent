import fs from 'fs'
import path from 'path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { parsePositiveInt, program } from '../src/index.js'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('cli', () => {
  it('rejects partial numbers', () => {
    expect(() => parsePositiveInt('2x')).toThrow('must be a positive number')
  })

  it('accepts plus-prefixed positive numbers', () => {
    expect(parsePositiveInt('+2')).toBe(2)
  })

  it('keeps reserve as a plan alias', () => {
    const command = program.commands.find(command => command.name() === 'plan')
    expect(command?.aliases()).toContain('reserve')
  })

  it('rejects unsafe numbers', () => {
    expect(() => parsePositiveInt('9007199254740992')).toThrow('must be a positive number')
  })

  it('uses the package version', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'))
    expect(program.version()).toBe(pkg.version)
  })

  it('keeps ls as a status alias', () => {
    const command = program.commands.find(command => command.name() === 'status')
    expect(command?.aliases()).toContain('ls')
  })

  it('keeps reserved as a status option', () => {
    const command = program.commands.find(command => command.name() === 'status')
    expect(command?.options.some(option => option.long === '--reserved')).toBe(true)
  })

  it('keeps reserved as a status short option', () => {
    const command = program.commands.find(command => command.name() === 'status')
    expect(command?.options.some(option => option.short === '-r')).toBe(true)
  })

  it('rejects stray args for option-only commands', () => {
    const cases = [
      { name: 'init', args: ['extra'] },
      { name: 'status', args: ['extra'] },
      { name: 'handoff', args: ['--from', 'claude', '--to', 'codex', 'extra'] },
      { name: 'log', args: ['extra'] },
      { name: 'check', args: ['extra'] },
      { name: 'sync', args: ['extra'] },
      { name: 'bridge', args: ['extra'] },
      { name: 'watch', args: ['extra'] }
    ]

    for (const { name, args } of cases) {
      const command = program.commands.find(command => command.name() === name)
      command?.exitOverride()
      command?.configureOutput({ writeErr: () => {}, writeOut: () => {} })

      let error: unknown
      try {
        command?.parse(args, { from: 'user' })
      } catch (err) {
        error = err
      }

      expect(error).toMatchObject({ code: 'commander.excessArguments' })
    }
  })

  it('keeps pass as a handoff alias', () => {
    const command = program.commands.find(command => command.name() === 'handoff')
    expect(command?.aliases()).toContain('pass')
  })

  it('rejects stray args through command aliases', () => {
    const cases = [
      { name: 'ls', args: ['extra'] },
      { name: 'history', args: ['extra'] },
      { name: 'ci', args: ['extra'] },
      { name: 'refresh', args: ['extra'] },
      { name: 'board', args: ['extra'] },
      { name: 'view', args: ['extra'] }
    ]

    for (const { name, args } of cases) {
      const command = program.commands.find(command => command.aliases().includes(name))
      command?.exitOverride()
      command?.configureOutput({ writeErr: () => {}, writeOut: () => {} })

      let error: unknown
      try {
        command?.parse(args, { from: 'user' })
      } catch (err) {
        error = err
      }

      expect(error).toMatchObject({ code: 'commander.excessArguments' })
    }
  })

  it('keeps ci as a check alias', () => {
    const command = program.commands.find(command => command.name() === 'check')
    expect(command?.aliases()).toContain('ci')
  })

  it('keeps history as a log alias', () => {
    const command = program.commands.find(command => command.name() === 'log')
    expect(command?.aliases()).toContain('history')
  })

  it('keeps refresh as a sync alias', () => {
    const command = program.commands.find(command => command.name() === 'sync')
    expect(command?.aliases()).toContain('refresh')
  })

  it('keeps mark as a touch alias', () => {
    const command = program.commands.find(command => command.name() === 'touch')
    expect(command?.aliases()).toContain('mark')
  })

  it('rejects partial bridge limits', () => {
    const command = program.commands.find(command => command.name() === 'bridge')
    const option = command?.options.find(option => option.long === '--limit')
    expect(() => option?.parseArg?.('2x', undefined)).toThrow('must be a positive number')
  })

  it('keeps unreserve as a release alias', () => {
    const command = program.commands.find(command => command.name() === 'release')
    expect(command?.aliases()).toContain('unreserve')
  })

  it('keeps free as a release alias', () => {
    const command = program.commands.find(command => command.name() === 'release')
    expect(command?.aliases()).toContain('free')
  })

  it('rejects files with release all', () => {
    const command = program.commands.find(command => command.name() === 'release')
    command?.exitOverride()
    command?.configureOutput({ writeErr: () => {}, writeOut: () => {} })
    const logs: string[] = []
    vi.spyOn(console, 'log').mockImplementation(message => logs.push(String(message)))
    vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit')
    }) as never)

    expect(() => {
      command?.parse(['--agent', 'codex', '--all', 'notes.md'], { from: 'user' })
    }).toThrow('exit')

    expect(logs[0]).toContain('Do not pass files with --all.')
  })

  it('keeps view as a watch alias', () => {
    const command = program.commands.find(command => command.name() === 'watch')
    expect(command?.aliases()).toContain('view')
  })

  it('keeps board as a bridge alias', () => {
    const command = program.commands.find(command => command.name() === 'bridge')
    expect(command?.aliases()).toContain('board')
  })
})
