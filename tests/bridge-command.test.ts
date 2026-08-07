import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { bridgeCommand } from '../src/commands/bridge.js'

const cwd = process.cwd()

afterEach(() => {
  process.chdir(cwd)
  vi.restoreAllMocks()
})

describe('bridge command', () => {
  it('reads latest messages first', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jaiye-bridge-command-'))
    const file = path.join(dir, 'bridge.md')
    const logs: string[] = []
    vi.spyOn(console, 'log').mockImplementation(message => logs.push(String(message)))

    bridgeCommand({
      file,
      append: true,
      agent: 'codex',
      message: 'first',
      status: 'done: first pass'
    })
    bridgeCommand({
      file,
      append: true,
      agent: 'codex',
      message: 'second',
      status: 'action'
    })

    logs.length = 0
    bridgeCommand({ file, read: true, limit: '2' })

    expect(logs[0].indexOf('second')).toBeLessThan(logs[0].indexOf('first'))
    expect(logs[0]).toContain('DONE: first pass')
    expect(logs[0]).not.toContain('DONE: done: first pass')
  })

  it('rejects invalid read limits', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jaiye-bridge-command-'))
    const file = path.join(dir, 'bridge.md')
    const logs: string[] = []
    vi.spyOn(console, 'log').mockImplementation(message => logs.push(String(message)))
    vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit')
    }) as never)

    expect(() => bridgeCommand({ file, read: true, limit: '2x' })).toThrow('exit')
    expect(logs[0]).toContain('Invalid limit.')
  })

  it('rejects empty read limits', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jaiye-bridge-command-'))
    const file = path.join(dir, 'bridge.md')
    const logs: string[] = []
    vi.spyOn(console, 'log').mockImplementation(message => logs.push(String(message)))
    vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit')
    }) as never)

    expect(() => bridgeCommand({ file, read: true, limit: '' })).toThrow('exit')
    expect(logs[0]).toContain('Invalid limit.')
  })

  it('rejects invalid archive ages', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jaiye-bridge-command-'))
    const file = path.join(dir, 'bridge.md')
    const logs: string[] = []
    vi.spyOn(console, 'log').mockImplementation(message => logs.push(String(message)))
    vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit')
    }) as never)

    expect(() => bridgeCommand({ file, archive: true, olderThan: 'soon' })).toThrow('exit')
    expect(logs[0]).toContain('Invalid age.')
  })
})
