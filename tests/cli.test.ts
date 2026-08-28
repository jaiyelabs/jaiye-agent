import fs from 'fs'
import path from 'path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseHost, parsePort, parsePositiveInt, program } from '../src/index.js'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('cli', () => {
  it('rejects partial numbers', () => {
    expect(() => parsePositiveInt('2x')).toThrow('must be a positive number')
  })

  it('rejects padded numbers', () => {
    expect(() => parsePositiveInt(' 2')).toThrow('must be a positive number')
  })

  it('accepts plus-prefixed positive numbers', () => {
    expect(parsePositiveInt('+2')).toBe(2)
  })

  it('rejects invalid ports', () => {
    expect(() => parsePort('65536')).toThrow('must be a valid port')
  })

  it('accepts the highest port', () => {
    expect(parsePort('65535')).toBe(65535)
  })

  it('accepts port zero', () => {
    expect(parsePort('0')).toBe(0)
  })

  it('rejects plus-prefixed ports', () => {
    expect(() => parsePort('+3000')).toThrow('must be a valid port')
  })

  it('rejects empty hosts', () => {
    expect(() => parseHost('')).toThrow('must be a valid host')
  })

  it('rejects padded hosts', () => {
    expect(() => parseHost(' localhost')).toThrow('must be a valid host')
  })

  it('rejects hosts with spaces', () => {
    expect(() => parseHost('local host')).toThrow('must be a valid host')
  })

  it('rejects url hosts', () => {
    expect(() => parseHost('http://localhost')).toThrow('must be a valid host')
  })

  it('rejects hosts with backslashes', () => {
    expect(() => parseHost('localhost\\debug')).toThrow('must be a valid host')
  })

  it('rejects host query text', () => {
    expect(() => parseHost('localhost?debug')).toThrow('must be a valid host')
  })

  it('rejects hosts with ports', () => {
    expect(() => parseHost('localhost:8787')).toThrow('must be a valid host')
  })

  it('rejects invalid colon hosts', () => {
    expect(() => parseHost('local::host')).toThrow('must be a valid host')
  })

  it('rejects invalid ipv4 hosts', () => {
    expect(() => parseHost('999.999.999.999')).toThrow('must be a valid host')
  })

  it('rejects empty host labels', () => {
    expect(() => parseHost('local..host')).toThrow('must be a valid host')
  })

  it('rejects dashed host labels', () => {
    expect(() => parseHost('-localhost')).toThrow('must be a valid host')
    expect(() => parseHost('local-.host')).toThrow('must be a valid host')
  })

  it('rejects long host labels', () => {
    expect(() => parseHost(`${'a'.repeat(64)}.local`)).toThrow('must be a valid host')
  })

  it('rejects long hosts', () => {
    expect(() => parseHost(`${'a'.repeat(63)}.${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(62)}.local`)).toThrow('must be a valid host')
  })

  it('rejects invalid host label characters', () => {
    expect(() => parseHost('local_host')).toThrow('must be a valid host')
    expect(() => parseHost('local!.host')).toThrow('must be a valid host')
  })

  it('accepts dashed host labels', () => {
    expect(parseHost('local-dev.host')).toBe('local-dev.host')
  })

  it('accepts ipv6 hosts', () => {
    expect(parseHost('::1')).toBe('::1')
  })

  it('accepts ipv4 hosts', () => {
    expect(parseHost('127.0.0.1')).toBe('127.0.0.1')
  })

  it('rejects host fragment text', () => {
    expect(() => parseHost('localhost#debug')).toThrow('must be a valid host')
  })

  it('keeps reserve as a plan alias', () => {
    const command = program.commands.find(command => command.name() === 'plan')
    expect(command?.aliases()).toContain('reserve')
  })

  it('keeps agent as a plan short option', () => {
    const command = program.commands.find(command => command.name() === 'plan')
    expect(command?.options.some(option => option.short === '-g')).toBe(true)
  })

  it('keeps hours as a plan short option', () => {
    const command = program.commands.find(command => command.name() === 'plan')
    expect(command?.options.some(option => option.short === '-H')).toBe(true)
  })

  it('rejects unsafe numbers', () => {
    expect(() => parsePositiveInt('9007199254740992')).toThrow('must be a positive number')
  })

  it('uses the package version', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'))
    expect(program.version()).toBe(pkg.version)
  })

  it('keeps scan as an init short option', () => {
    const command = program.commands.find(command => command.name() === 'init')
    expect(command?.options.some(option => option.short === '-s')).toBe(true)
  })

  it('keeps ls as a status alias', () => {
    const command = program.commands.find(command => command.name() === 'status')
    expect(command?.aliases()).toContain('ls')
  })

  it('keeps reserved as a status option', () => {
    const command = program.commands.find(command => command.name() === 'status')
    expect(command?.options.some(option => option.long === '--reserved')).toBe(true)
  })

  it('keeps all as a status option', () => {
    const command = program.commands.find(command => command.name() === 'status')
    expect(command?.options.some(option => option.long === '--all')).toBe(true)
  })

  it('keeps reserved as a status short option', () => {
    const command = program.commands.find(command => command.name() === 'status')
    expect(command?.options.some(option => option.short === '-r')).toBe(true)
  })

  it('keeps all as a status short option', () => {
    const command = program.commands.find(command => command.name() === 'status')
    expect(command?.options.some(option => option.short === '-a')).toBe(true)
  })

  it('keeps agent as a status option', () => {
    const command = program.commands.find(command => command.name() === 'status')
    expect(command?.options.some(option => option.long === '--agent')).toBe(true)
  })

  it('keeps agent as a status short option', () => {
    const command = program.commands.find(command => command.name() === 'status')
    expect(command?.options.some(option => option.short === '-g')).toBe(true)
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

  it('keeps summary as a handoff short option', () => {
    const command = program.commands.find(command => command.name() === 'handoff')
    expect(command?.options.some(option => option.short === '-s')).toBe(true)
  })

  it('keeps from and to as handoff short options', () => {
    const command = program.commands.find(command => command.name() === 'handoff')
    expect(command?.options.some(option => option.short === '-f')).toBe(true)
    expect(command?.options.some(option => option.short === '-t')).toBe(true)
  })

  it('keeps context as a handoff short option', () => {
    const command = program.commands.find(command => command.name() === 'handoff')
    expect(command?.options.some(option => option.short === '-c')).toBe(true)
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

  it('keeps base as a check short option', () => {
    const command = program.commands.find(command => command.name() === 'check')
    expect(command?.options.some(option => option.short === '-b')).toBe(true)
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

  it('keeps agent as a touch short option', () => {
    const command = program.commands.find(command => command.name() === 'touch')
    expect(command?.options.some(option => option.short === '-g')).toBe(true)
  })

  it('rejects partial bridge limits', () => {
    const command = program.commands.find(command => command.name() === 'bridge')
    const option = command?.options.find(option => option.long === '--limit')
    expect(() => option?.parseArg?.('2x', undefined)).toThrow('must be a positive number')
  })

  it('keeps limit short options', () => {
    const log = program.commands.find(command => command.name() === 'log')
    const bridge = program.commands.find(command => command.name() === 'bridge')

    expect(log?.options.some(option => option.short === '-n')).toBe(true)
    expect(bridge?.options.some(option => option.short === '-n')).toBe(true)
  })

  it('keeps file as a bridge short option', () => {
    const command = program.commands.find(command => command.name() === 'bridge')
    expect(command?.options.some(option => option.short === '-f')).toBe(true)
  })

  it('keeps between as a bridge short option', () => {
    const command = program.commands.find(command => command.name() === 'bridge')
    expect(command?.options.some(option => option.short === '-B')).toBe(true)
  })

  it('keeps message as a bridge short option', () => {
    const command = program.commands.find(command => command.name() === 'bridge')
    expect(command?.options.some(option => option.short === '-m')).toBe(true)
  })

  it('keeps agent as a bridge short option', () => {
    const command = program.commands.find(command => command.name() === 'bridge')
    expect(command?.options.some(option => option.short === '-g')).toBe(true)
  })

  it('keeps unreserve as a release alias', () => {
    const command = program.commands.find(command => command.name() === 'release')
    expect(command?.aliases()).toContain('unreserve')
  })

  it('keeps free as a release alias', () => {
    const command = program.commands.find(command => command.name() === 'release')
    expect(command?.aliases()).toContain('free')
  })

  it('keeps all as a release short option', () => {
    const command = program.commands.find(command => command.name() === 'release')
    expect(command?.options.some(option => option.short === '-a')).toBe(true)
  })

  it('keeps agent as a release short option', () => {
    const command = program.commands.find(command => command.name() === 'release')
    expect(command?.options.some(option => option.short === '-g')).toBe(true)
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

  it('rejects files with release short all', () => {
    const command = program.commands.find(command => command.name() === 'release')
    command?.exitOverride()
    command?.configureOutput({ writeErr: () => {}, writeOut: () => {} })
    const logs: string[] = []
    vi.spyOn(console, 'log').mockImplementation(message => logs.push(String(message)))
    vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit')
    }) as never)

    expect(() => {
      command?.parse(['-g', 'codex', '-a', 'notes.md'], { from: 'user' })
    }).toThrow('exit')

    expect(logs[0]).toContain('Do not pass files with --all.')
  })

  it('keeps view as a watch alias', () => {
    const command = program.commands.find(command => command.name() === 'watch')
    expect(command?.aliases()).toContain('view')
  })

  it('keeps port as a watch short option', () => {
    const command = program.commands.find(command => command.name() === 'watch')
    expect(command?.options.some(option => option.short === '-p')).toBe(true)
  })

  it('keeps host as a watch short option', () => {
    const command = program.commands.find(command => command.name() === 'watch')
    expect(command?.options.some(option => option.short === '-H')).toBe(true)
  })

  it('keeps tasks dir as a watch short option', () => {
    const command = program.commands.find(command => command.name() === 'watch')
    expect(command?.options.some(option => option.short === '-d')).toBe(true)
  })

  it('keeps open as a watch short option', () => {
    const command = program.commands.find(command => command.name() === 'watch')
    expect(command?.options.some(option => option.short === '-o')).toBe(true)
  })

  it('keeps board as a bridge alias', () => {
    const command = program.commands.find(command => command.name() === 'bridge')
    expect(command?.aliases()).toContain('board')
  })
})
