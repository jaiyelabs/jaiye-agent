import { execSync } from 'child_process'
import type { AgentDef, CommitInfo } from '../types.js'

export function getCurrentBranch(): string {
  return execSync('git branch --show-current', { encoding: 'utf-8' }).trim()
}

export function getRecentCommits(count = 20): CommitInfo[] {
  try {
    const raw = execSync(
      `git log -${count} --format='%H|%an|%s|%aI'`,
      { encoding: 'utf-8' }
    ).trim()

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
  try {
    const raw = execSync(
      `git diff --name-only ${ref}`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim()

    if (!raw) return []
    return raw.split('\n')
  } catch {
    // fallback: list all tracked files if ref doesn't exist (shallow repo)
    try {
      const raw = execSync(
        'git ls-files',
        { encoding: 'utf-8' }
      ).trim()

      if (!raw) return []
      return raw.split('\n')
    } catch {
      return []
    }
  }
}

export function getFilesInPR(baseBranch: string): string[] {
  try {
    const raw = execSync(
      `git diff --name-only origin/${baseBranch}...HEAD`,
      { encoding: 'utf-8' }
    ).trim()

    if (!raw) return []
    return raw.split('\n')
  } catch {
    // fallback without origin
    try {
      const raw = execSync(
        `git diff --name-only ${baseBranch}...HEAD`,
        { encoding: 'utf-8' }
      ).trim()

      if (!raw) return []
      return raw.split('\n')
    } catch {
      return []
    }
  }
}

export function getCommitsInPR(baseBranch: string): CommitInfo[] {
  try {
    const raw = execSync(
      `git log --format='%H|%an|%s|%aI' origin/${baseBranch}...HEAD`,
      { encoding: 'utf-8' }
    ).trim()

    if (!raw) return []

    return raw.split('\n').map(line => {
      const [hash, author, message, date] = line.split('|')
      return { hash, author, message, date }
    })
  } catch {
    try {
      const raw = execSync(
        `git log --format='%H|%an|%s|%aI' ${baseBranch}...HEAD`,
        { encoding: 'utf-8' }
      ).trim()

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
  try {
    return execSync('git diff --stat HEAD~1', { encoding: 'utf-8' }).trim()
  } catch {
    return ''
  }
}

export function getFilesChangedInCommit(hash: string): string[] {
  try {
    const raw = execSync(
      `git diff-tree --no-commit-id --name-only -r ${hash}`,
      { encoding: 'utf-8' }
    ).trim()

    if (!raw) return []
    return raw.split('\n')
  } catch {
    return []
  }
}

export function identifyAgent(commit: CommitInfo, agents: AgentDef[]): string | null {
  for (const agent of agents) {
    if (commit.message.startsWith(agent.commit_prefix)) {
      return agent.name
    }
  }
  return null
}
