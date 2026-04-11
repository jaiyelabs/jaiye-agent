export interface JaiyeConfig {
  version: number
  agents: AgentDef[]
  ownership: OwnershipRule[]
  settings: Settings
}

export interface AgentDef {
  name: string
  description: string
  commit_prefix: string
}

export interface OwnershipRule {
  pattern: string
  agent: string
}

export interface Settings {
  handoff_dir: string
  conflict_mode: 'warn' | 'error'
  base_branch: string
}

export interface Handoff {
  id: string
  from: string
  to: string
  timestamp: string
  branch: string
  status: 'clean' | 'wip' | 'blocked'
  summary: string
  files_touched: string[]
  notes: string
}

export interface CommitInfo {
  hash: string
  author: string
  message: string
  date: string
}

export interface OwnershipEntry {
  file: string
  assigned_agent: string | null
  last_touched_by: string | null
  conflict: boolean
}

export interface ConflictReport {
  file: string
  agents: string[]
  commits: CommitInfo[]
}
