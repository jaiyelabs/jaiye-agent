import { describe, expect, it } from 'vitest'
import { program } from '../src/index.js'

describe('log help', () => {
  it('shows how to read all handoffs', () => {
    const command = program.commands.find(command => command.name() === 'log')
    let output = ''
    command?.configureOutput({ writeOut: text => { output += text } })

    expect(command?.helpInformation()).toContain('Use --all to show every handoff.')
    command?.outputHelp()
    expect(output).toContain('jaiye-agent log --all')
  })
})
