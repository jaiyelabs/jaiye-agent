import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { activeReservations, releaseAllFiles, releaseFiles, reserveFiles, syncState, touchFiles } from './state.js'
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

  it('reserves and releases files', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jaiye-state-'))
    process.chdir(dir)
    fs.mkdirSync('.jaiye')
    fs.writeFileSync('notes.md', 'hello')

    const config: JaiyeConfig = {
      version: 2,
      agents: [{ name: 'codex', description: 'codex' }, { name: 'claude', description: 'claude' }],
      ownership: [{ pattern: '*.md', agent: 'codex', artifact_type: 'document' }],
      settings: {
        handoff_dir: '.jaiye/handoffs',
        conflict_mode: 'warn',
        base_branch: 'main'
      }
    }

    const planned = reserveFiles('codex', ['notes.md'], config)
    expect(planned.blocked).toHaveLength(0)
    expect(activeReservations()['notes.md'].agent).toBe('codex')

    const blocked = reserveFiles('claude', ['notes.md'], config)
    expect(blocked.blocked[0].reservation.agent).toBe('codex')

    expect(releaseFiles('codex', ['notes.md'])).toBe(1)
    expect(activeReservations()['notes.md']).toBeUndefined()
  })

  it('keeps outside paths absolute', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jaiye-state-'))
    process.chdir(dir)
    fs.mkdirSync('.jaiye')
    const outside = `${dir}-other/notes.md`
    fs.mkdirSync(path.dirname(outside))
    fs.writeFileSync(outside, 'hello')

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

    reserveFiles('codex', [outside], config)
    expect(activeReservations()[outside].agent).toBe('codex')
  })

  it('releases all files for an agent', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jaiye-state-'))
    process.chdir(dir)
    fs.mkdirSync('.jaiye')

    const config: JaiyeConfig = {
      version: 2,
      agents: [{ name: 'codex', description: 'codex' }, { name: 'claude', description: 'claude' }],
      ownership: [{ pattern: '*.md', agent: 'codex', artifact_type: 'document' }],
      settings: {
        handoff_dir: '.jaiye/handoffs',
        conflict_mode: 'warn',
        base_branch: 'main'
      }
    }

    reserveFiles('codex', ['a.md', 'b.md'], config)
    reserveFiles('claude', ['c.md'], config)

    expect(releaseAllFiles('codex')).toBe(2)
    expect(activeReservations()['a.md']).toBeUndefined()
    expect(activeReservations()['c.md'].agent).toBe('claude')
  })

  it('removes expired reservations from state', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jaiye-state-'))
    process.chdir(dir)
    fs.mkdirSync('.jaiye')
    fs.writeFileSync(path.join('.jaiye', 'state.json'), JSON.stringify({
      version: 1,
      files: {},
      reservations: {
        'old.md': {
          agent: 'codex',
          created_at: '2026-01-01T00:00:00.000Z',
          expires_at: '2026-01-01T01:00:00.000Z'
        },
        'new.md': {
          agent: 'codex',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        }
      },
      updated: '2026-01-01T00:00:00.000Z'
    }, null, 2))

    const reservations = activeReservations()
    expect(reservations['old.md']).toBeUndefined()
    expect(reservations['new.md'].agent).toBe('codex')

    const state = JSON.parse(fs.readFileSync(path.join('.jaiye', 'state.json'), 'utf-8'))
    expect(state.reservations['old.md']).toBeUndefined()
  })
})
