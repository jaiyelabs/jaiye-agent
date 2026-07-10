import { execFileSync } from 'child_process'
import type { AgentDef, CommitInfo } from '../types.js'
import { detectMode } from './mode.js'

function git(args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
}

export function getCurrentBranch(): string {
  if (detectMode() === 'standalone') return ''
  return git(['branch', '--show-current'])
}

export function getRecentCommits(count = 20): CommitInfo[] {
  if (detectMode() === 'standalone') return []
  try {
    const raw = git(['log', `-${count}`, '--format=%H|%an|%s|%aI'])

    if (!raw) return []

    return raw.split('\n').map(line => {
      const [hash, author, message, date] = line.split('|')
      return { hash, author, message, date }
    })
  } catch {
    return []
  }
}

export function getFilesChangedSince(ref: string): string[] {
  if (detectMode() === 'standalone') return []
  try {
    const raw = git(['diff', '--name-only', ref])

    if (!raw) return []
    return raw.split('\n')
  } catch {
    // fallback: list all tracked files if ref doesn't exist (shallow repo)
    try {
      const raw = git(['ls-files'])

      if (!raw) return []
      return raw.split('\n')
    } catch {
      return []
    }
  }
}

export function getFilesInPR(baseBranch: string): string[] {
  if (detectMode() === 'standalone') return []
  try {
    const raw = git(['diff', '--name-only', `origin/${baseBranch}...HEAD`])

    if (!raw) return []
    return raw.split('\n')
  } catch {
    // fallback without origin
    try {
      const raw = git(['diff', '--name-only', `${baseBranch}...HEAD`])

      if (!raw) return []
      return raw.split('\n')
    } catch {
      return []
    }
  }
}

export function getCommitsInPR(baseBranch: string): CommitInfo[] {
  if (detectMode() === 'standalone') return []
  try {
    const raw = git(['log', '--format=%H|%an|%s|%aI', `origin/${baseBranch}...HEAD`])

    if (!raw) return []

    return raw.split('\n').map(line => {
      const [hash, author, message, date] = line.split('|')
      return { hash, author, message, date }
    })
  } catch {
    try {
      const raw = git(['log', '--format=%H|%an|%s|%aI', `${baseBranch}...HEAD`])

      if (!raw) return []

      return raw.split('\n').map(line => {
        const [hash, author, message, date] = line.split('|')
        return { hash, author, message, date }
      })
    } catch {
      return []
    }
  }
}

export function getDiffStat(): string {
  if (detectMode() === 'standalone') return ''
  try {
    return git(['diff', '--stat', 'HEAD~1'])
  } catch {
    return ''
  }
}

export function getFilesChangedInCommit(hash: string): string[] {
  if (detectMode() === 'standalone') return []
  try {
    const raw = git(['diff-tree', '--no-commit-id', '--name-only', '-r', hash])

    if (!raw) return []
    return raw.split('\n')
  } catch {
    return []
  }
}

export function identifyAgent(commit: CommitInfo, agents: AgentDef[]): string | null {
  for (const agent of agents) {
    if (agent.commit_prefix && commit.message.startsWith(agent.commit_prefix)) {
      return agent.name
    }
  }
  return null
}
