import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { program } from '../src/index.js'

const cwd = process.cwd()

afterEach(() => {
  process.chdir(cwd)
  vi.restoreAllMocks()
})

describe('log --all', () => {
  it('shows handoffs beyond the default limit', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jaiye-log-all-'))
    try {
      process.chdir(dir)
      fs.mkdirSync('.jaiye/handoffs', { recursive: true })
      for (let i = 0; i < 11; i++) {
        fs.writeFileSync(`.jaiye/handoffs/${String(i).padStart(2, '0')}.md`, `---
id: ${i}
from: codex
to: claude
---

## Summary
handoff ${i}
`)
      }
      const logs: string[] = []
      vi.spyOn(console, 'log').mockImplementation(message => logs.push(String(message)))
      const command = program.commands.find(command => command.name() === 'log')

      command?.parse([], { from: 'user' })
      expect(logs.join('\n')).not.toContain('handoff 0')
      logs.length = 0
      command?.parse(['--all', '--limit', '0'], { from: 'user' })
      expect(logs.join('\n')).toContain('handoff 0')
      expect(logs.join('\n')).toContain('handoff 10')
    } finally {
      process.chdir(cwd)
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
})
