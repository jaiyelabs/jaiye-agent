export interface JaiyeConfig {
  version: number
  project?: ProjectDef
  agents: AgentDef[]
  ownership: OwnershipRule[]
  settings: Settings
}

export interface ProjectDef {
  name: string
  type: 'code' | 'media' | 'content' | 'research' | 'mixed'
}

export interface AgentDef {
  name: string
  description: string
  commit_prefix?: string
  type?: 'cli' | 'desktop' | 'ide' | 'custom'
  capabilities?: string[]
  bridge?: string
}

export interface OwnershipRule {
  pattern: string
  agent: string
  artifact_type?: string
}

export interface Settings {
  handoff_dir: string
  conflict_mode: 'warn' | 'error'
  base_branch: string
  bridge_dir?: string
}

export interface Handoff {
  id: string
  from: string
  to: string
  timestamp: string
  branch?: string
  status: 'clean' | 'wip' | 'blocked'
  summary: string
  files_touched: FileRef[]
  notes: string
  context?: HandoffContext
}

export interface FileRef {
  path: string
  artifact_type?: string
  description?: string
}

export interface HandoffContext {
  mode?: string
  dependencies?: string[]
  decisions_needed?: string[]
  constraints?: string[]
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

export interface ProjectState {
  version: number
  files: Record<string, StateFileEntry>
  reservations?: Record<string, StateReservation>
  updated: string
}

export interface StateFileEntry {
  assigned: string | null
  last_touched_by: string | null
  last_modified: string
  artifact_type?: string
}

export interface StateReservation {
  agent: string
  created_at: string
  expires_at: string
}

export interface BridgeMessage {
  agent: string
  timestamp: string
  message: string
  status?: string
}
