import fs from 'fs'
import os from 'os'
import path from 'path'
import { describe, expect, it } from 'vitest'
import { appendBridgeMessage, archiveBridge, createBridge, readBridgeMessages } from './bridge.js'

describe('bridge', () => {
  it('creates, reads and archives bridge messages', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jaiye-bridge-'))
    const file = path.join(dir, 'bridge.md')

    createBridge(file, 'cowork,codex')
    appendBridgeMessage({
      agent: 'codex',
      timestamp: '2026-01-01T00:00:00.000Z',
      message: 'done',
      status: 'done'
    }, file)
    appendBridgeMessage({
      agent: 'codex',
      timestamp: new Date().toISOString(),
      message: 'still active',
      status: 'action'
    }, file)

    expect(readBridgeMessages(file, 2).some(message => message.includes('DONE: done'))).toBe(true)
    expect(readBridgeMessages(file, 2)[0]).toContain('still active')
    expect(readBridgeMessages(file, 0)).toHaveLength(0)

    const result = archiveBridge(file, '1d')
    expect(result.archived).toBe(1)
    expect(result.active).toBe(1)
    expect(fs.existsSync(path.join(dir, 'bridge_archive.md'))).toBe(true)
    expect(readBridgeMessages(file)).toHaveLength(1)
  })

  it('keeps status details after the marker', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jaiye-bridge-'))
    const file = path.join(dir, 'bridge.md')

    appendBridgeMessage({
      agent: 'codex',
      timestamp: '2026-01-01T00:00:00.000Z',
      message: 'mapped the files',
      status: 'done: source map added'
    }, file)

    const messages = readBridgeMessages(file)
    expect(messages[0]).toContain('DONE: source map added')
    expect(messages[0]).not.toContain('DONE: done: source map added')
  })

  it('archives epoch timestamps', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jaiye-bridge-'))
    const file = path.join(dir, 'bridge.md')

    appendBridgeMessage({
      agent: 'codex',
      timestamp: '1970-01-01T00:00:00.000Z',
      message: 'old done',
      status: 'done'
    }, file)

    const result = archiveBridge(file, '1d')

    expect(result.archived).toBe(1)
    expect(readBridgeMessages(file)).toHaveLength(0)
  })
})
