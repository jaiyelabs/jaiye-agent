import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { readWatchSnapshot } from './watch.js'

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
})
