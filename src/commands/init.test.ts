import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { initCommand } from './init.js'

const cwd = process.cwd()

afterEach(() => {
  process.chdir(cwd)
  vi.restoreAllMocks()
})

describe('init', () => {
  it('writes detected project type into config', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jaiye-init-'))
    process.chdir(dir)
    fs.writeFileSync('clip.mov', '')
    vi.spyOn(console, 'log').mockImplementation(() => {})

    initCommand()

    const config = fs.readFileSync(path.join(dir, '.jaiye/config.yaml'), 'utf-8')
    expect(config).toContain(`name: "${path.basename(dir)}"`)
    expect(config).toContain('type: "media"')
    expect(fs.existsSync(path.join(dir, '.jaiye/bridges'))).toBe(true)
    expect(fs.existsSync(path.join(dir, 'AGENTS.md'))).toBe(true)
  })

  it('can scan project folders into ownership rules', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jaiye-init-'))
    process.chdir(dir)
    fs.mkdirSync('src')
    fs.mkdirSync('components')
    fs.mkdirSync('tests')
    fs.mkdirSync('docs')
    fs.writeFileSync('README.md', '')
    vi.spyOn(console, 'log').mockImplementation(() => {})

    initCommand({ scan: true })

    const config = fs.readFileSync(path.join(dir, '.jaiye/config.yaml'), 'utf-8')
    expect(config).toContain('pattern: "src/**"')
    expect(config).toContain('agent: claude')
    expect(config).toContain('pattern: "components/**"')
    expect(config).toContain('agent: codex')
    expect(config).toContain('pattern: "docs/**"')
    expect(config).toContain('pattern: "README.md"')
    expect(config).toContain('artifact_type: document')
  })

  it('keeps scanned media files with cowork', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jaiye-init-'))
    process.chdir(dir)
    fs.writeFileSync('clip.mov', '')
    vi.spyOn(console, 'log').mockImplementation(() => {})

    initCommand({ scan: true })

    const config = fs.readFileSync(path.join(dir, '.jaiye/config.yaml'), 'utf-8')
    expect(config).toContain('type: "media"')
    expect(config).toContain('pattern: "*.mov"')
    expect(config).toContain('agent: cowork')
    expect(config).toContain('artifact_type: media')
  })
})
