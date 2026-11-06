import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseAge, parseAgent, parseBridgeBetween, parseBridgeMessage, parseBridgeStatus, parseHost, parseMode, parsePath, parsePort, parsePositiveInt, parseRef, parseSummary, program } from '../src/index.js'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('cli', () => {
  it('rejects partial numbers', () => {
    expect(() => parsePositiveInt('2x')).toThrow('must be a positive number')
  })

  it('rejects padded numbers', () => {
    expect(() => parsePositiveInt(' 2')).toThrow('must be a positive number')
    expect(() => parsePositiveInt('02')).toThrow('must be a positive number')
    expect(() => parsePositiveInt('+02')).toThrow('must be a positive number')
  })

  it('accepts plus-prefixed positive numbers', () => {
    expect(parsePositiveInt('+2')).toBe(2)
  })

  it('rejects padded refs', () => {
    expect(() => parseRef(' main')).toThrow('must be a valid ref')
  })

  it('rejects unsafe refs', () => {
    expect(() => parseRef('')).toThrow('must be a valid ref')
    expect(() => parseRef('main~1')).toThrow('must be a valid ref')
    expect(() => parseRef('main\x01topic')).toThrow('must be a valid ref')
    expect(() => parseRef('main..topic')).toThrow('must be a valid ref')
    expect(() => parseRef('/main')).toThrow('must be a valid ref')
    expect(() => parseRef('.main')).toThrow('must be a valid ref')
    expect(() => parseRef('-main')).toThrow('must be a valid ref')
    expect(() => parseRef('feature/main.')).toThrow('must be a valid ref')
    expect(() => parseRef('main.lock/topic')).toThrow('must be a valid ref')
  })

  it('accepts branch refs', () => {
    expect(parseRef('@')).toBe('@')
    expect(parseRef('feature/check-output')).toBe('feature/check-output')
    expect(parseRef('release/v0.2.0')).toBe('release/v0.2.0')
    expect(parseRef('feature/-main')).toBe('feature/-main')
    expect(parseRef('feature/main./next')).toBe('feature/main./next')
  })

  it('rejects invalid ages', () => {
    expect(() => parseAge('7days')).toThrow('must be a valid age')
    expect(() => parseAge('')).toThrow('must be a valid age')
    expect(() => parseAge(' 7d')).toThrow('must be a valid age')
    expect(() => parseAge('7d\n')).toThrow('must be a valid age')
    expect(() => parseAge('0d')).toThrow('must be a valid age')
    expect(() => parseAge('01d')).toThrow('must be a valid age')
    expect(() => parseAge('9007199254740992d')).toThrow('must be a valid age')
  })

  it('rejects ages that produce an invalid date', () => {
    expect(() => parseAge('9007199254740991d')).toThrow('must be a valid age')
  })

  it('accepts ages', () => {
    expect(parseAge('7d')).toBe('7d')
    expect(parseAge('12h')).toBe('12h')
    expect(parseAge('30m')).toBe('30m')
  })

  it('rejects invalid paths', () => {
    expect(() => parsePath('')).toThrow('must be a valid path')
    expect(() => parsePath(' bridge.md')).toThrow('must be a valid path')
    expect(() => parsePath('bridge.md\n')).toThrow('must be a valid path')
    expect(() => parsePath('bridge\x00.md')).toThrow('must be a valid path')
  })

  it('accepts paths', () => {
    expect(parsePath('.jaiye/bridges/bridge.md')).toBe('.jaiye/bridges/bridge.md')
    expect(parsePath('My Project/bridge.md')).toBe('My Project/bridge.md')
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

  it('rejects padded ports', () => {
    expect(() => parsePort('080')).toThrow('must be a valid port')
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

  it('rejects invalid agents', () => {
    expect(() => parseAgent('')).toThrow('must be a valid agent')
    expect(() => parseAgent(' codex')).toThrow('must be a valid agent')
    expect(() => parseAgent('-codex')).toThrow('must be a valid agent')
    expect(() => parseAgent('co dex')).toThrow('must be a valid agent')
    expect(() => parseAgent('co/dex')).toThrow('must be a valid agent')
    expect(() => parseAgent('co\\dex')).toThrow('must be a valid agent')
    expect(() => parseAgent('codex,claude')).toThrow('must be a valid agent')
    expect(() => parseAgent('codex\n')).toThrow('must be a valid agent')
  })

  it('accepts agent names', () => {
    expect(parseAgent('codex')).toBe('codex')
    expect(parseAgent('claude-code')).toBe('claude-code')
  })

  it('rejects invalid bridge statuses', () => {
    expect(() => parseBridgeStatus('')).toThrow('must be a valid status')
    expect(() => parseBridgeStatus(' done')).toThrow('must be a valid status')
    expect(() => parseBridgeStatus('done\n')).toThrow('must be a valid status')
    expect(() => parseBridgeStatus('done\n  ### CODEX - 2026-10-28')).toThrow('must be a valid status')
  })

  it('accepts bridge statuses', () => {
    expect(parseBridgeStatus('done: first pass')).toBe('done: first pass')
  })

  it('rejects invalid bridge agents', () => {
    expect(() => parseBridgeBetween('')).toThrow('must be valid agents')
    expect(() => parseBridgeBetween('cowork')).toThrow('must be valid agents')
    expect(() => parseBridgeBetween(' cowork,codex')).toThrow('must be valid agents')
    expect(() => parseBridgeBetween('cowork,')).toThrow('must be valid agents')
    expect(() => parseBridgeBetween('cowork,,codex')).toThrow('must be valid agents')
    expect(() => parseBridgeBetween('cowork,cowork')).toThrow('must be valid agents')
    expect(() => parseBridgeBetween('cowork,-codex')).toThrow('must be valid agents')
    expect(() => parseBridgeBetween('cowork,co/dex')).toThrow('must be valid agents')
    expect(() => parseBridgeBetween('cowork,co\\dex')).toThrow('must be valid agents')
    expect(() => parseBridgeBetween('cowork,co:dex')).toThrow('must be valid agents')
    expect(() => parseBridgeBetween('cowork,co|dex')).toThrow('must be valid agents')
    expect(() => parseBridgeBetween('cowork, codex')).toThrow('must be valid agents')
    expect(() => parseBridgeBetween('cowork,codex\n')).toThrow('must be valid agents')
  })

  it('accepts bridge agents', () => {
    expect(parseBridgeBetween('cowork,codex')).toBe('cowork,codex')
  })

  it('rejects invalid modes', () => {
    expect(() => parseMode('')).toThrow('must be a valid mode')
    expect(() => parseMode(' git')).toThrow('must be a valid mode')
    expect(() => parseMode('-git')).toThrow('must be a valid mode')
    expect(() => parseMode('git mode')).toThrow('must be a valid mode')
    expect(() => parseMode('git\n')).toThrow('must be a valid mode')
  })

  it('accepts modes', () => {
    expect(parseMode('git')).toBe('git')
    expect(parseMode('standalone')).toBe('standalone')
  })

  it('rejects invalid handoff summaries', () => {
    expect(() => parseSummary('')).toThrow('must be a valid summary')
    expect(() => parseSummary(' handoff')).toThrow('must be a valid summary')
    expect(() => parseSummary('## Notes')).toThrow('must be a valid summary')
    expect(() => parseSummary('handoff\n## Notes')).toThrow('must be a valid summary')
  })

  it('accepts handoff summaries', () => {
    expect(parseSummary('handoff ready')).toBe('handoff ready')
  })

  it('rejects bridge message headers', () => {
    expect(() => parseBridgeMessage('   ')).toThrow('must be a valid message')
    expect(() => parseBridgeMessage('### CODEX - 2026-10-28')).toThrow('must be a valid message')
    expect(() => parseBridgeMessage('  ### CODEX - 2026-10-28')).toThrow('must be a valid message')
    expect(() => parseBridgeMessage('first note\n### CODEX - 2026-10-28')).toThrow('must be a valid message')
  })

  it('accepts multiline bridge messages', () => {
    expect(parseBridgeMessage('first note\nsecond note')).toBe('first note\nsecond note')
  })

  it('keeps reserve as a plan alias', () => {
    const command = program.commands.find(command => command.name() === 'plan')
    expect(command?.aliases()).toContain('reserve')
  })

  it('keeps claim as a plan alias', () => {
    const command = program.commands.find(command => command.name() === 'plan')
    expect(command?.aliases()).toContain('claim')
  })

  it('keeps agent as a plan short option', () => {
    const command = program.commands.find(command => command.name() === 'plan')
    expect(command?.options.some(option => option.short === '-g')).toBe(true)
  })

  it('keeps hours as a plan short option', () => {
    const command = program.commands.find(command => command.name() === 'plan')
    expect(command?.options.some(option => option.short === '-H')).toBe(true)
  })

  it('rejects empty plan files', () => {
    const command = program.commands.find(command => command.name() === 'plan')
    const argument = command?.registeredArguments[0]
    expect(() => argument?.parseArg?.('', undefined)).toThrow('must be a valid path')
  })

  it('rejects unsafe numbers', () => {
    expect(() => parsePositiveInt('9007199254740992')).toThrow('must be a positive number')
  })

  it('uses the package version', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'))
    expect(program.version()).toBe(pkg.version)
  })

  it('shows help after errors', () => {
    expect(program.showHelpAfterError()).toBe(program)
  })

  it('keeps scan as an init short option', () => {
    const command = program.commands.find(command => command.name() === 'init')
    expect(command?.options.some(option => option.short === '-s')).toBe(true)
  })

  it('keeps setup as an init alias', () => {
    const command = program.commands.find(command => command.name() === 'init')
    expect(command?.aliases()).toContain('setup')
  })

  it('keeps ls as a status alias', () => {
    const command = program.commands.find(command => command.name() === 'status')
    expect(command?.aliases()).toContain('ls')
  })

  it('keeps st as a status alias', () => {
    const command = program.commands.find(command => command.name() === 'status')
    expect(command?.aliases()).toContain('st')
  })

  it('keeps owners as a status alias', () => {
    const command = program.commands.find(command => command.name() === 'status')
    expect(command?.aliases()).toContain('owners')
  })

  it('keeps who as a status alias', () => {
    const command = program.commands.find(command => command.name() === 'status')
    expect(command?.aliases()).toContain('who')
  })

  it('keeps list as a status alias', () => {
    const command = program.commands.find(command => command.name() === 'status')
    expect(command?.aliases()).toContain('list')
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

  it('keeps send as a handoff alias', () => {
    const command = program.commands.find(command => command.name() === 'handoff')
    expect(command?.aliases()).toContain('send')
  })

  it('keeps handover as a handoff alias', () => {
    const command = program.commands.find(command => command.name() === 'handoff')
    expect(command?.aliases()).toContain('handover')
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

  it('keeps mode as a handoff short option', () => {
    const command = program.commands.find(command => command.name() === 'handoff')
    expect(command?.options.some(option => option.short === '-M')).toBe(true)
  })

  it('rejects padded handoff agents', () => {
    const command = program.commands.find(command => command.name() === 'handoff')
    const option = command?.options.find(option => option.long === '--from')
    expect(() => option?.parseArg?.(' codex', undefined)).toThrow('must be a valid agent')
  })

  it('rejects padded handoff modes', () => {
    const command = program.commands.find(command => command.name() === 'handoff')
    const option = command?.options.find(option => option.long === '--mode')
    expect(() => option?.parseArg?.(' git', undefined)).toThrow('must be a valid mode')
  })

  it('rejects stray args through command aliases', () => {
    const cases = [
      { name: 'ls', args: ['extra'] },
      { name: 'st', args: ['extra'] },
      { name: 'owners', args: ['extra'] },
      { name: 'who', args: ['extra'] },
      { name: 'list', args: ['extra'] },
      { name: 'setup', args: ['extra'] },
      { name: 'history', args: ['extra'] },
      { name: 'handoffs', args: ['extra'] },
      { name: 'recent', args: ['extra'] },
      { name: 'send', args: ['--from', 'claude', '--to', 'codex', 'extra'] },
      { name: 'handover', args: ['--from', 'claude', '--to', 'codex', 'extra'] },
      { name: 'ci', args: ['extra'] },
      { name: 'verify', args: ['extra'] },
      { name: 'audit', args: ['extra'] },
      { name: 'conflicts', args: ['extra'] },
      { name: 'refresh', args: ['extra'] },
      { name: 'board', args: ['extra'] },
      { name: 'messages', args: ['extra'] },
      { name: 'msg', args: ['extra'] },
      { name: 'inbox', args: ['extra'] },
      { name: 'tail', args: ['extra'] },
      { name: 'latest', args: ['extra'] },
      { name: 'view', args: ['extra'] },
      { name: 'serve', args: ['extra'] },
      { name: 'live', args: ['extra'] }
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

  it('keeps verify as a check alias', () => {
    const command = program.commands.find(command => command.name() === 'check')
    expect(command?.aliases()).toContain('verify')
  })

  it('keeps audit as a check alias', () => {
    const command = program.commands.find(command => command.name() === 'check')
    expect(command?.aliases()).toContain('audit')
  })

  it('keeps conflicts as a check alias', () => {
    const command = program.commands.find(command => command.name() === 'check')
    expect(command?.aliases()).toContain('conflicts')
  })

  it('keeps base as a check short option', () => {
    const command = program.commands.find(command => command.name() === 'check')
    expect(command?.options.some(option => option.short === '-b')).toBe(true)
  })

  it('rejects unsafe check base refs', () => {
    const command = program.commands.find(command => command.name() === 'check')
    const option = command?.options.find(option => option.long === '--base')
    expect(() => option?.parseArg?.('main~1', undefined)).toThrow('must be a valid ref')
  })

  it('keeps history as a log alias', () => {
    const command = program.commands.find(command => command.name() === 'log')
    expect(command?.aliases()).toContain('history')
  })

  it('keeps handoffs as a log alias', () => {
    const command = program.commands.find(command => command.name() === 'log')
    expect(command?.aliases()).toContain('handoffs')
  })

  it('keeps recent as a log alias', () => {
    const command = program.commands.find(command => command.name() === 'log')
    expect(command?.aliases()).toContain('recent')
  })

  it('rejects invalid log limits', () => {
    const command = program.commands.find(command => command.name() === 'log')
    const option = command?.options.find(option => option.long === '--limit')
    expect(() => option?.parseArg?.('2x', undefined)).toThrow('must be a positive number')
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

  it('rejects empty touch files', () => {
    const command = program.commands.find(command => command.name() === 'touch')
    const argument = command?.registeredArguments[0]
    expect(() => argument?.parseArg?.('', undefined)).toThrow('must be a valid path')
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

  it('rejects empty bridge files', () => {
    const command = program.commands.find(command => command.name() === 'bridge')
    const option = command?.options.find(option => option.long === '--file')
    expect(() => option?.parseArg?.('', undefined)).toThrow('must be a valid path')
  })

  it('keeps between as a bridge short option', () => {
    const command = program.commands.find(command => command.name() === 'bridge')
    expect(command?.options.some(option => option.short === '-B')).toBe(true)
  })

  it('rejects empty bridge agents', () => {
    const command = program.commands.find(command => command.name() === 'bridge')
    const option = command?.options.find(option => option.long === '--between')
    expect(() => option?.parseArg?.('', undefined)).toThrow('must be valid agents')
  })

  it('keeps message as a bridge short option', () => {
    const command = program.commands.find(command => command.name() === 'bridge')
    expect(command?.options.some(option => option.short === '-m')).toBe(true)
  })

  it('keeps append as a bridge short option', () => {
    const command = program.commands.find(command => command.name() === 'bridge')
    expect(command?.options.some(option => option.short === '-A')).toBe(true)
  })

  it('keeps read as a bridge short option', () => {
    const command = program.commands.find(command => command.name() === 'bridge')
    expect(command?.options.some(option => option.short === '-R')).toBe(true)
  })

  it('keeps all as a bridge short option', () => {
    const command = program.commands.find(command => command.name() === 'bridge')
    expect(command?.options.some(option => option.short === '-l')).toBe(true)
  })

  it('keeps tail as a bridge option', () => {
    const command = program.commands.find(command => command.name() === 'bridge')
    expect(command?.options.some(option => option.long === '--tail')).toBe(true)
  })

  it('keeps read as a bridge alias', () => {
    const command = program.commands.find(command => command.name() === 'bridge')
    expect(command?.aliases()).toContain('read')
  })

  it('keeps tail as a bridge short option', () => {
    const command = program.commands.find(command => command.name() === 'bridge')
    expect(command?.options.some(option => option.short === '-T')).toBe(true)
  })

  it('keeps agent as a bridge short option', () => {
    const command = program.commands.find(command => command.name() === 'bridge')
    expect(command?.options.some(option => option.short === '-g')).toBe(true)
  })

  it('keeps status as a bridge short option', () => {
    const command = program.commands.find(command => command.name() === 'bridge')
    expect(command?.options.some(option => option.short === '-s')).toBe(true)
  })

  it('rejects empty bridge statuses', () => {
    const command = program.commands.find(command => command.name() === 'bridge')
    const option = command?.options.find(option => option.long === '--status')
    expect(() => option?.parseArg?.('', undefined)).toThrow('must be a valid status')
  })

  it('keeps archive as a bridge short option', () => {
    const command = program.commands.find(command => command.name() === 'bridge')
    expect(command?.options.some(option => option.short === '-a')).toBe(true)
  })

  it('rejects unsafe bridge archive ages', () => {
    const command = program.commands.find(command => command.name() === 'bridge')
    const option = command?.options.find(option => option.long === '--older-than')
    expect(() => option?.parseArg?.('soon', undefined)).toThrow('must be a valid age')
    expect(() => option?.parseArg?.('0d', undefined)).toThrow('must be a valid age')
    expect(() => option?.parseArg?.('9007199254740992d', undefined)).toThrow('must be a valid age')
  })

  it('keeps unreserve as a release alias', () => {
    const command = program.commands.find(command => command.name() === 'release')
    expect(command?.aliases()).toContain('unreserve')
  })

  it('keeps free as a release alias', () => {
    const command = program.commands.find(command => command.name() === 'release')
    expect(command?.aliases()).toContain('free')
  })

  it('keeps unclaim as a release alias', () => {
    const command = program.commands.find(command => command.name() === 'release')
    expect(command?.aliases()).toContain('unclaim')
  })

  it('keeps all as a release short option', () => {
    const command = program.commands.find(command => command.name() === 'release')
    expect(command?.options.some(option => option.short === '-a')).toBe(true)
  })

  it('keeps agent as a release short option', () => {
    const command = program.commands.find(command => command.name() === 'release')
    expect(command?.options.some(option => option.short === '-g')).toBe(true)
  })

  it('rejects empty release files', () => {
    const command = program.commands.find(command => command.name() === 'release')
    const argument = command?.registeredArguments[0]
    expect(() => argument?.parseArg?.('', undefined)).toThrow('must be a valid path')
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

  it('keeps serve as a watch alias', () => {
    const command = program.commands.find(command => command.name() === 'watch')
    expect(command?.aliases()).toContain('serve')
  })

  it('keeps live as a watch alias', () => {
    const command = program.commands.find(command => command.name() === 'watch')
    expect(command?.aliases()).toContain('live')
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

  it('rejects empty watch task dirs', () => {
    const command = program.commands.find(command => command.name() === 'watch')
    const option = command?.options.find(option => option.long === '--tasks-dir')
    expect(() => option?.parseArg?.('', undefined)).toThrow('must be a valid path')
  })

  it('keeps open as a watch short option', () => {
    const command = program.commands.find(command => command.name() === 'watch')
    expect(command?.options.some(option => option.short === '-o')).toBe(true)
  })

  it('keeps board as a bridge alias', () => {
    const command = program.commands.find(command => command.name() === 'bridge')
    expect(command?.aliases()).toContain('board')
  })

  it('keeps messages as a bridge alias', () => {
    const command = program.commands.find(command => command.name() === 'bridge')
    expect(command?.aliases()).toContain('messages')
  })

  it('keeps msg as a bridge alias', () => {
    const command = program.commands.find(command => command.name() === 'bridge')
    expect(command?.aliases()).toContain('msg')
  })

  it('keeps latest as a bridge alias', () => {
    const command = program.commands.find(command => command.name() === 'bridge')
    expect(command?.aliases()).toContain('latest')
  })

  it('shows a bridge append example in command help', () => {
    const command = program.commands.find(command => command.name() === 'bridge')
    let output = ''
    command?.configureOutput({ writeOut: text => { output += text } })

    command?.outputHelp()
    expect(output).toContain('jaiye-agent bridge --append --agent codex')
  })

  it('reads bridge messages through reading aliases and short all', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jaiye-cli-'))
    const file = path.join(dir, 'bridge.md')
    const logs: string[] = []
    vi.spyOn(console, 'log').mockImplementation(message => logs.push(String(message)))

    program.parse(['node', 'jaiye-agent', 'board', '--file', file], { from: 'node' })
    program.parse(['node', 'jaiye-agent', 'messages', '--file', file], { from: 'node' })
    program.parse(['node', 'jaiye-agent', 'msg', '--file', file], { from: 'node' })
    program.parse(['node', 'jaiye-agent', 'inbox', '--file', file], { from: 'node' })
    program.parse(['node', 'jaiye-agent', 'read', '--file', file], { from: 'node' })
    program.parse(['node', 'jaiye-agent', 'tail', '--file', file], { from: 'node' })
    program.parse(['node', 'jaiye-agent', 'latest', '--file', file], { from: 'node' })
    program.parse(['node', 'jaiye-agent', 'bridge', '-l', '--file', file], { from: 'node' })

    expect(fs.existsSync(file)).toBe(false)
    expect(logs).toEqual(['No bridge messages found.', 'No bridge messages found.', 'No bridge messages found.', 'No bridge messages found.', 'No bridge messages found.', 'No bridge messages found.', 'No bridge messages found.', 'No bridge messages found.'])
  })
})
