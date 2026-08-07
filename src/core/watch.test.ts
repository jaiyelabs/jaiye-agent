import fs from 'fs'
import os from 'os'
import path from 'path'
import { once } from 'events'
import { afterEach, describe, expect, it } from 'vitest'
import { readWatchSnapshot, startWatchServer } from './watch.js'

const cwd = process.cwd()

afterEach(() => {
  process.chdir(cwd)
})

describe('watch', () => {
  it('reads bridge, handoff, decision and state files', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jaiye-watch-'))
    process.chdir(dir)

    fs.mkdirSync(path.join(dir, '.jaiye', 'bridges'), { recursive: true })
    fs.mkdirSync(path.join(dir, '.jaiye', 'handoffs'), { recursive: true })
    fs.mkdirSync(path.join(dir, 'ops', 'decisions'), { recursive: true })

    fs.writeFileSync(path.join(dir, '.jaiye', 'bridges', 'bridge.md'), 'bridge note')
    fs.writeFileSync(path.join(dir, '.jaiye', 'handoffs', 'handoff.md'), 'handoff note')
    fs.writeFileSync(path.join(dir, '.jaiye', 'state.json'), '{"files":{}}')
    fs.writeFileSync(path.join(dir, 'ops', 'decisions', 'decision.md'), 'decision note')

    const snapshot = readWatchSnapshot()

    expect(snapshot.sources.map(source => source.type)).toEqual(['bridge', 'handoff', 'decision', 'state'])
    expect(snapshot.sources.map(source => source.content)).toEqual(['bridge note', 'handoff note', 'decision note', '{"files":{}}'])
  })

  it('keeps port zero for a random watch port', async () => {
    const server = startWatchServer({ port: 0, host: '127.0.0.1' })
    await once(server, 'listening')

    const address = server.address()
    expect(typeof address === 'object' && address?.port).not.toBe(8787)

    server.close()
  })
})
