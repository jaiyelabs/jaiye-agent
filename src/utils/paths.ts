import { execSync } from 'child_process'
import path from 'path'

export function getRepoRoot(): string {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim()
  } catch {
    throw new Error('Not a git repository. Run this command inside a git repo.')
  }
}

export function getJaiyeDir(): string {
  return path.join(getRepoRoot(), '.jaiye')
}

export function getConfigPath(): string {
  return path.join(getJaiyeDir(), 'config.yaml')
}

export function getHandoffDir(): string {
  return path.join(getJaiyeDir(), 'handoffs')
}

export function getAgentsMdPath(): string {
  return path.join(getRepoRoot(), 'AGENTS.md')
}
