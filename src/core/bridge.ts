import fs from 'fs'
import path from 'path'
import type { BridgeMessage } from '../types.js'
import { getProjectRoot } from './mode.js'
import { getBridgeDir } from '../utils/paths.js'

export function resolveBridgeFile(file?: string): string {
  if (file) return path.resolve(file)
  return path.join(getBridgeDir(), 'bridge.md')
}

export function createBridge(file?: string, between?: string): string {
  const bridgeFile = resolveBridgeFile(file)
  fs.mkdirSync(path.dirname(bridgeFile), { recursive: true })

  if (fs.existsSync(bridgeFile)) return bridgeFile

  const agents = between || 'agents'
  const content = `# Jaiye Bridge

Persistent message board for ${agents}.

## Protocol

- Each message is a section with a header: \`### AGENT - TIMESTAMP\`
- Messages are appended
- End requests with \`ACTION: ...\`
- End completed work with \`DONE: ...\`

## Messages
`

  fs.writeFileSync(bridgeFile, content)
  return bridgeFile
}

export function appendBridgeMessage(message: BridgeMessage, file?: string): string {
  const bridgeFile = createBridge(file)
  const header = `### ${message.agent.toUpperCase()} - ${message.timestamp}`
  const status = message.status ? `\n\n${formatStatus(message.status)}` : ''
  fs.appendFileSync(bridgeFile, `\n\n${header}\n\n${message.message}${status}\n`)
  return bridgeFile
}

export function readBridgeMessages(file?: string, limit = 10): string[] {
  const bridgeFile = resolveBridgeFile(file)
  if (!fs.existsSync(bridgeFile)) return []

  const content = fs.readFileSync(bridgeFile, 'utf-8')
  const parts = content.split(/\n(?=### )/).filter(part => part.startsWith('### '))
  const count = Math.floor(limit)
  if (!Number.isFinite(count) || count <= 0) return []
  return parts.slice(-count).reverse()
}

export function archiveBridge(file?: string, olderThan = '7d'): { archived: number, active: number, archiveFile: string } {
  const bridgeFile = resolveBridgeFile(file)
  if (!fs.existsSync(bridgeFile)) return { archived: 0, active: 0, archiveFile: '' }

  const content = fs.readFileSync(bridgeFile, 'utf-8')
  const firstMessage = content.indexOf('\n### ')
  const intro = firstMessage >= 0 ? content.slice(0, firstMessage) : content
  const messages = firstMessage >= 0
    ? content.slice(firstMessage + 1).split(/\n(?=### )/)
    : []

  const cutoff = Date.now() - parseAge(olderThan)
  const keep: string[] = []
  const archive: string[] = []

  for (const message of messages) {
    const isDone = /\nDONE:/.test(message)
    const date = message.match(/^### .+? - (.+)$/m)?.[1] || ''
    const time = Date.parse(date)

    if (isDone && !Number.isNaN(time) && time < cutoff) {
      archive.push(message)
    } else {
      keep.push(message)
    }
  }

  if (archive.length === 0) {
    return { archived: 0, active: keep.length, archiveFile: archivePath(bridgeFile) }
  }

  const archiveFile = archivePath(bridgeFile)
  const archiveHeader = fs.existsSync(archiveFile) ? '' : `# Jaiye Bridge Archive\n\nSource: ${path.relative(getProjectRoot(), bridgeFile)}\n`
  fs.appendFileSync(archiveFile, `${archiveHeader}\n\n${archive.join('\n\n')}\n`)
  fs.writeFileSync(bridgeFile, `${intro.trimEnd()}\n\n${keep.join('\n\n')}\n`)

  return { archived: archive.length, active: keep.length, archiveFile }
}

function archivePath(file: string): string {
  const parsed = path.parse(file)
  return path.join(parsed.dir, `${parsed.name}_archive${parsed.ext}`)
}

function formatStatus(status: string): string {
  const parts = status.split(':')
  const label = parts.shift() || status
  const text = parts.join(':').trim() || status
  return `${label.toUpperCase()}: ${text}`
}

function parseAge(value: string): number {
  const match = value.match(/^(\d+)([dhm])$/)
  if (!match) return 7 * 24 * 60 * 60 * 1000

  const amount = Number(match[1])
  const unit = match[2]
  if (unit === 'd') return amount * 24 * 60 * 60 * 1000
  if (unit === 'h') return amount * 60 * 60 * 1000
  return amount * 60 * 1000
}
