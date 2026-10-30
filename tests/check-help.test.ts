import { describe, expect, it } from 'vitest'
import { parseBridgeStatus, program } from '../src/index.js'

describe('check command help', () => {
  it('shows a check example', () => {
    const command = program.commands.find(command => command.name() === 'check')
    let output = ''
    command?.configureOutput({ writeOut: text => { output += text } })

    command?.outputHelp()

    expect(output).toContain('jaiye-agent check --base main')
  })

  it('rejects bridge status headers', () => {
    expect(() => parseBridgeStatus('done:\n### CODEX - 2026-10-29')).toThrow('must be a valid status')
  })
})
