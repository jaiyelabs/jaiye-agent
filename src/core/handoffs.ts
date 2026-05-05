import fs from 'fs'
import path from 'path'
import type { Handoff } from '../types.js'
import { getHandoffDir } from '../utils/paths.js'
import { parseYaml, dumpYaml } from '../utils/yaml.js'

export function createHandoff(handoff: Handoff): string {
  const dir = getHandoffDir()
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const filename = `${handoff.id}-${handoff.from}-to-${handoff.to}.md`
  const filepath = path.join(dir, filename)

  const frontmatter = dumpYaml({
    id: handoff.id,
    from: handoff.from,
    to: handoff.to,
    timestamp: handoff.timestamp,
    branch: handoff.branch,
    status: handoff.status,
    context: handoff.context
  })

  const filesTouchedList = handoff.files_touched.map(f => {
    const meta = [f.artifact_type, f.description].filter(Boolean).join(' — ')
    return `- ${f.path}${meta ? ` — ${meta}` : ''}`
  }).join('\n')

  const content = `---
${frontmatter.trim()}
---

## Summary
${handoff.summary || 'No summary provided.'}

## Files Touched
${filesTouchedList || 'No files listed.'}

## Notes
${handoff.notes || 'None.'}
`

  fs.writeFileSync(filepath, content)
  return filepath
}

export function listHandoffs(): Handoff[] {
  const dir = getHandoffDir()
  if (!fs.existsSync(dir)) return []

  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .sort()
    .reverse()

  return files.map(file => {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8')
    return parseHandoff(content)
  })
}

function parseHandoff(content: string): Handoff {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)

  if (!match) {
    return {
      id: 'unknown',
      from: 'unknown',
      to: 'unknown',
      timestamp: '',
      branch: '',
      status: 'clean',
      summary: '',
      files_touched: [],
      notes: ''
    }
  }

  const frontmatter = parseYaml<Record<string, string>>(match[1])
  const body = match[2]

  // extract summary from body
  const summaryMatch = body.match(/## Summary\n([\s\S]*?)(?=\n## |$)/)
  const summary = summaryMatch ? summaryMatch[1].trim() : ''

  // extract files from body
  const filesMatch = body.match(/## Files Touched\n([\s\S]*?)(?=\n## |$)/)
  const files = filesMatch
    ? filesMatch[1].trim().split('\n').map(l => {
        const [file, artifact_type, description] = l.replace(/^- /, '').trim().split(' — ')
        return { path: file, artifact_type, description }
      }).filter(f => f.path && f.path !== 'No files listed.')
    : []

  const notesMatch = body.match(/## Notes\n([\s\S]*?)(?=\n## |$)/)
  const notes = notesMatch ? notesMatch[1].trim() : ''

  return {
    id: frontmatter.id || 'unknown',
    from: frontmatter.from || 'unknown',
    to: frontmatter.to || 'unknown',
    timestamp: frontmatter.timestamp || '',
    branch: frontmatter.branch || '',
    status: (frontmatter.status as Handoff['status']) || 'clean',
    summary,
    files_touched: files,
    notes,
    context: frontmatter.context as Handoff['context']
  }
}
