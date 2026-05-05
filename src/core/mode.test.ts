import fs from 'fs'
import os from 'os'
import path from 'path'
import { execSync } from 'child_process'
import { afterEach, describe, expect, it } from 'vitest'
import { detectMode, detectProjectType, getProjectRoot } from './mode.js'

const cwd = process.cwd()

afterEach(() => {
  process.chdir(cwd)
})

describe('mode', () => {
  it('detects standalone projects outside git', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jaiye-mode-'))
    process.chdir(dir)

    expect(detectMode()).toBe('standalone')
    expect(fs.realpathSync(getProjectRoot())).toBe(fs.realpathSync(dir))
  })

  it('detects git projects', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jaiye-git-mode-'))
    execSync('git init', { cwd: dir, stdio: 'ignore' })
    process.chdir(dir)

    expect(detectMode()).toBe('git')
    expect(fs.realpathSync(getProjectRoot())).toBe(fs.realpathSync(dir))
  })

  it('detects project type from local files', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jaiye-type-'))
    fs.writeFileSync(path.join(dir, 'cut.mp4'), '')

    expect(detectProjectType(dir)).toBe('media')

    fs.writeFileSync(path.join(dir, 'notes.md'), 'notes')
    expect(detectProjectType(dir)).toBe('mixed')
  })
})
