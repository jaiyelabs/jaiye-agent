import path from 'path'
import { getProjectRoot } from '../core/mode.js'

export function getRepoRoot(): string {
  return getProjectRoot()
}

export function getJaiyeDir(): string {
  return path.join(getProjectRoot(), '.jaiye')
}

export function getConfigPath(): string {
  return path.join(getJaiyeDir(), 'config.yaml')
}

export function getHandoffDir(): string {
  return path.join(getJaiyeDir(), 'handoffs')
}

export function getAgentsMdPath(): string {
  return path.join(getProjectRoot(), 'AGENTS.md')
}

export function getStatePath(): string {
  return path.join(getJaiyeDir(), 'state.json')
}

export function getBridgeDir(): string {
  return path.join(getJaiyeDir(), 'bridges')
}
