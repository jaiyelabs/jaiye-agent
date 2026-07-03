import fs from 'fs'
import path from 'path'
import type { JaiyeConfig, ProjectState, StateFileEntry, StateReservation } from '../types.js'
import { getProjectRoot } from './mode.js'
import { getStatePath } from '../utils/paths.js'
import { findOwner } from './ownership.js'

export function loadState(): ProjectState {
  const statePath = getStatePath()
  if (!fs.existsSync(statePath)) {
    return { version: 1, files: {}, reservations: {}, updated: new Date().toISOString() }
  }

  const state = JSON.parse(fs.readFileSync(statePath, 'utf-8')) as ProjectState
  state.reservations ||= {}
  return state
}

export function saveState(state: ProjectState) {
  const statePath = getStatePath()
  fs.mkdirSync(path.dirname(statePath), { recursive: true })
  state.updated = new Date().toISOString()
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n')
}

export function touchFiles(agent: string, files: string[], config: JaiyeConfig): ProjectState {
  const root = getProjectRoot()
  const state = loadState()

  for (const file of files) {
    const rel = normalizeFile(file, root)
    const full = path.isAbsolute(rel) ? rel : path.join(root, rel)
    const stat = fs.existsSync(full) ? fs.statSync(full) : null
    const existing = state.files[rel]

    state.files[rel] = {
      assigned: findOwner(rel, config),
      last_touched_by: agent,
      last_modified: stat ? stat.mtime.toISOString() : new Date().toISOString(),
      artifact_type: existing?.artifact_type || findArtifactType(rel, config)
    }
  }

  saveState(state)
  return state
}

export function syncState(config: JaiyeConfig): ProjectState {
  const root = getProjectRoot()
  const state = loadState()
  const files = listProjectFiles(root)

  for (const file of files) {
    const full = path.join(root, file)
    const stat = fs.statSync(full)
    const existing = state.files[file]

    state.files[file] = {
      assigned: findOwner(file, config),
      last_touched_by: existing?.last_touched_by || null,
      last_modified: stat.mtime.toISOString(),
      artifact_type: existing?.artifact_type || findArtifactType(file, config)
    }
  }

  for (const file of Object.keys(state.files)) {
    if (!files.includes(file)) {
      delete state.files[file]
    }
  }

  saveState(state)
  return state
}

export function stateEntries(config: JaiyeConfig): Array<{ file: string } & StateFileEntry> {
  const state = syncState(config)
  return Object.entries(state.files).map(([file, entry]) => ({ file, ...entry }))
}

export function reserveFiles(agent: string, files: string[], config: JaiyeConfig, hours = 4) {
  const root = getProjectRoot()
  const state = loadState()
  pruneReservations(state)

  const blocked: Array<{ file: string, reservation: StateReservation }> = []
  const expires = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
  const created = new Date().toISOString()

  for (const file of files) {
    const rel = normalizeFile(file, root)
    const existing = state.reservations?.[rel]

    if (existing && existing.agent !== agent) {
      blocked.push({ file: rel, reservation: existing })
      continue
    }

    state.reservations![rel] = {
      agent,
      created_at: created,
      expires_at: expires
    }

    if (!state.files[rel]) {
      const full = path.isAbsolute(rel) ? rel : path.join(root, rel)
      const stat = fs.existsSync(full) ? fs.statSync(full) : null
      state.files[rel] = {
        assigned: findOwner(rel, config),
        last_touched_by: null,
        last_modified: stat ? stat.mtime.toISOString() : created,
        artifact_type: findArtifactType(rel, config)
      }
    }
  }

  saveState(state)
  return { state, blocked }
}

export function releaseFiles(agent: string, files: string[]) {
  const root = getProjectRoot()
  const state = loadState()
  pruneReservations(state)
  let released = 0

  for (const file of files) {
    const rel = normalizeFile(file, root)
    const existing = state.reservations?.[rel]
    if (existing?.agent === agent) {
      delete state.reservations![rel]
      released++
    }
  }

  saveState(state)
  return released
}

export function releaseAllFiles(agent: string) {
  const state = loadState()
  pruneReservations(state)
  let released = 0

  for (const [file, reservation] of Object.entries(state.reservations || {})) {
    if (reservation.agent === agent) {
      delete state.reservations![file]
      released++
    }
  }

  saveState(state)
  return released
}

export function activeReservations(): Record<string, StateReservation> {
  const state = loadState()
  const pruned = pruneReservations(state)
  if (pruned > 0) saveState(state)
  return state.reservations || {}
}

function normalizeFile(file: string, root: string): string {
  const resolved = path.resolve(file)
  const rel = path.relative(root, resolved)
  if (rel && !rel.startsWith('..') && !path.isAbsolute(rel)) return rel
  return resolved
}

function pruneReservations(state: ProjectState): number {
  state.reservations ||= {}
  const now = Date.now()
  let pruned = 0
  for (const [file, reservation] of Object.entries(state.reservations)) {
    if (new Date(reservation.expires_at).getTime() <= now) {
      delete state.reservations[file]
      pruned++
    }
  }
  return pruned
}

function findArtifactType(file: string, config: JaiyeConfig): string | undefined {
  const rule = config.ownership.find(r => findOwner(file, { ...config, ownership: [r] }) === r.agent)
  if (rule?.artifact_type) return rule.artifact_type
  if (/\.(mp4|mov|mp3|wav|png|jpg|jpeg|psd)$/.test(file)) return 'media'
  if (/\.(xlsx|csv)$/.test(file)) return 'data'
  if (/\.(md|docx|pdf|txt)$/.test(file)) return 'document'
  return 'code'
}

function listProjectFiles(root: string): string[] {
  const out: string[] = []
  const ignored = new Set(['.git', 'node_modules', 'dist'])

  function walk(dir: string, prefix = '') {
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      if (ignored.has(entry.name)) continue
      const rel = path.join(prefix, entry.name)
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full, rel)
      } else if (rel !== '.jaiye/state.json') {
        out.push(rel)
      }
    }
  }

  walk(root)
  return out.sort()
}
