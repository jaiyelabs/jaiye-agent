import picomatch from 'picomatch'
import type { JaiyeConfig, CommitInfo, OwnershipEntry, ConflictReport } from '../types.js'
import { identifyAgent, getRecentCommits, getFilesChangedInCommit } from './git.js'

export function findOwner(file: string, config: JaiyeConfig): string | null {
  for (const rule of config.ownership) {
    const isMatch = picomatch(rule.pattern)
    if (isMatch(file)) {
      return rule.agent
    }
  }
  return null
}

export function resolveOwnership(files: string[], config: JaiyeConfig): OwnershipEntry[] {
  const commits = getRecentCommits(50)
  const fileAgentMap = new Map<string, string>()

  // build a map of which agent last touched each file
  for (const commit of commits) {
    const agent = identifyAgent(commit, config.agents)
    if (!agent) continue

    const changedFiles = getFilesChangedInCommit(commit.hash)
    for (const f of changedFiles) {
      if (!fileAgentMap.has(f)) {
        fileAgentMap.set(f, agent)
      }
    }
  }

  return files.map(file => {
    const assigned = findOwner(file, config)
    const lastTouched = fileAgentMap.get(file) || null
    const conflict = assigned !== null && lastTouched !== null && assigned !== lastTouched

    return {
      file,
      assigned_agent: assigned,
      last_touched_by: lastTouched,
      conflict
    }
  })
}

export function detectConflicts(
  files: string[],
  commits: CommitInfo[],
  config: JaiyeConfig
): ConflictReport[] {
  // group commits by file
  const fileCommits = new Map<string, { agents: Set<string>, commits: CommitInfo[] }>()

  for (const commit of commits) {
    const agent = identifyAgent(commit, config.agents)
    if (!agent) continue

    const changedFiles = getFilesChangedInCommit(commit.hash)
    for (const f of changedFiles) {
      if (!files.includes(f)) continue

      if (!fileCommits.has(f)) {
        fileCommits.set(f, { agents: new Set(), commits: [] })
      }

      const entry = fileCommits.get(f)!
      entry.agents.add(agent)
      entry.commits.push(commit)
    }
  }

  const conflicts: ConflictReport[] = []

  for (const [file, data] of fileCommits) {
    if (data.agents.size > 1) {
      conflicts.push({
        file,
        agents: [...data.agents],
        commits: data.commits
      })
    }
  }

  return conflicts
}
