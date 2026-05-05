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
})
