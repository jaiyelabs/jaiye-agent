import fs from 'fs'
import os from 'os'
import path from 'path'
import { execFileSync } from 'child_process'
import { afterEach, describe, expect, it } from 'vitest'
import { getCommitsInPR, getRecentCommits } from './git.js'

const cwd = process.cwd()

afterEach(() => {
  process.chdir(cwd)
})

describe('git', () => {
  it('keeps pipes in commit messages', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jaiye-git-'))
    process.chdir(dir)

    execFileSync('git', ['init'], { stdio: 'ignore' })
    execFileSync('git', ['config', 'user.email', 'codex@example.com'])
    execFileSync('git', ['config', 'user.name', 'Codex'])
    fs.writeFileSync('notes.md', 'hello')
    execFileSync('git', ['add', 'notes.md'])
    execFileSync('git', ['commit', '-m', '[codex] fix parser | keep detail'], { stdio: 'ignore' })

    const [commit] = getRecentCommits(1)

    expect(commit.message).toBe('[codex] fix parser | keep detail')
    expect(commit.author).toBe('Codex')
  })

  it('keeps pipes in PR commit messages', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jaiye-git-'))
    process.chdir(dir)

    execFileSync('git', ['init'], { stdio: 'ignore' })
    execFileSync('git', ['config', 'user.email', 'codex@example.com'])
    execFileSync('git', ['config', 'user.name', 'Codex'])
    fs.writeFileSync('notes.md', 'hello')
    execFileSync('git', ['add', 'notes.md'])
    execFileSync('git', ['commit', '-m', '[codex] first'], { stdio: 'ignore' })
    execFileSync('git', ['branch', 'base'])
    fs.writeFileSync('more.md', 'hello again')
    execFileSync('git', ['add', 'more.md'])
    execFileSync('git', ['commit', '-m', '[codex] add detail | with pipe'], { stdio: 'ignore' })

    const [commit] = getCommitsInPR('base')

    expect(commit.message).toBe('[codex] add detail | with pipe')
    expect(commit.author).toBe('Codex')
  })
})
