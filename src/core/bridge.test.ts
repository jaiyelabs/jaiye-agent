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
    expect(readBridgeMessages(file, 0)).toHaveLength(0)

    const result = archiveBridge(file, '1d')
    expect(result.archived).toBe(1)
    expect(result.active).toBe(1)
    expect(fs.existsSync(path.join(dir, 'bridge_archive.md'))).toBe(true)
    expect(readBridgeMessages(file)).toHaveLength(1)
  })
})
