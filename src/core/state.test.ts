import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { syncState, touchFiles } from './state.js'
import type { JaiyeConfig } from '../types.js'

const cwd = process.cwd()

afterEach(() => {
  process.chdir(cwd)
})

describe('state', () => {
  it('syncs files and records explicit touches', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jaiye-state-'))
    process.chdir(dir)
    fs.mkdirSync('.jaiye')
    fs.writeFileSync('notes.md', 'hello')

    const config: JaiyeConfig = {
      version: 2,
      agents: [{ name: 'codex', description: 'codex' }],
      ownership: [{ pattern: '*.md', agent: 'codex', artifact_type: 'document' }],
      settings: {
        handoff_dir: '.jaiye/handoffs',
        conflict_mode: 'warn',
        base_branch: 'main'
      }
    }

    const synced = syncState(config)
    expect(synced.files['notes.md'].assigned).toBe('codex')
    expect(synced.files['notes.md'].artifact_type).toBe('document')

    const touched = touchFiles('codex', ['notes.md'], config)
    expect(touched.files['notes.md'].last_touched_by).toBe('codex')
  })
})
