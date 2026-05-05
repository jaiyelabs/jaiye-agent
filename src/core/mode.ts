import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

export type ProjectMode = 'git' | 'standalone'

export function detectMode(): ProjectMode {
  try {
    execSync('git rev-parse --show-toplevel', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
    return 'git'
  } catch {
    return 'standalone'
  }
}

export function getProjectRoot(): string {
  if (detectMode() === 'git') {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim()
  }

  let dir = process.cwd()
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, '.jaiye'))) {
      return dir
    }
    dir = path.dirname(dir)
  }

  return process.cwd()
}

export function detectProjectType(root = getProjectRoot()): 'code' | 'media' | 'content' | 'research' | 'mixed' {
  const files = listSampleFiles(root)
  const hasCode = files.some(f => /\.(ts|tsx|js|jsx|py|rb|go|rs|swift)$/.test(f)) ||
    files.some(f => ['package.json', 'tsconfig.json', 'Cargo.toml', 'pyproject.toml'].includes(f))
  const hasMedia = files.some(f => /\.(mp4|mov|mp3|wav|aiff|psd|prproj|capcut|png|jpg|jpeg)$/.test(f))
  const hasDocs = files.some(f => /\.(md|docx|pdf|xlsx|csv|txt)$/.test(f))

  const count = [hasCode, hasMedia, hasDocs].filter(Boolean).length
  if (count > 1) return 'mixed'
  if (hasMedia) return 'media'
  if (hasDocs) return 'content'
  return 'code'
}

function listSampleFiles(root: string): string[] {
  const out: string[] = []
  const ignored = new Set(['.git', 'node_modules', 'dist', '.jaiye'])

  function walk(dir: string, prefix = '') {
    if (out.length > 200) return
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      if (ignored.has(entry.name)) continue
      const rel = path.join(prefix, entry.name)
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), rel)
      } else {
        out.push(rel)
      }
    }
  }

  walk(root)
  return out
}
