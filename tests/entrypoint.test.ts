import fs from 'fs'
import os from 'os'
import path from 'path'
import { execFileSync, spawnSync } from 'child_process'
import { build } from 'tsup'
import { describe, expect, it } from 'vitest'

describe('cli entrypoint', () => {
  it('runs through a symlink, shows status examples and suggests commands', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jaiye-entrypoint-'))
    try {
      fs.copyFileSync('package.json', path.join(dir, 'package.json'))
      fs.symlinkSync(path.resolve('node_modules'), path.join(dir, 'node_modules'), 'dir')
      await build({
        entry: ['src/index.ts'],
        outDir: path.join(dir, 'dist'),
        format: ['esm'],
        config: false,
        silent: true,
        banner: { js: '#!/usr/bin/env node' }
      })
      const entry = path.join(dir, 'dist', 'index.js')
      const link = path.join(dir, 'jaiye-agent')
      const bridge = path.join(dir, 'bridge.md')
      fs.chmodSync(entry, 0o755)
      fs.symlinkSync(entry, link)
      fs.writeFileSync(bridge, Array.from({ length: 11 }, (_, index) => `### CODEX - 2026-10-01T00:00:00.000Z\n\nmessage ${index}`).join('\n\n'))

      const version = execFileSync(link, ['--version'], { encoding: 'utf-8' }).trim()
      const help = execFileSync(link, ['status', '--help'], { encoding: 'utf-8' })
      const bridgeMessages = execFileSync(link, ['bridge', '--all', '--file', bridge], { encoding: 'utf-8' })
      const typo = spawnSync(link, ['stats'], { encoding: 'utf-8' })

      expect(version).toBe(JSON.parse(fs.readFileSync('package.json', 'utf-8')).version)
      expect(help).toContain('jaiye-agent status --all')
      expect(help).toContain('jaiye-agent status --reserved --agent codex')
      expect(help).toContain('Show all known files')
      expect(bridgeMessages).toContain('message 0')
      expect(bridgeMessages).toContain('message 10')
      expect(typo.status).toBe(1)
      expect(typo.stderr).toContain('Did you mean status?')
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
})
