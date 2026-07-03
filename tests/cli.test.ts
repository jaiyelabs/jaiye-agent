import { describe, expect, it } from 'vitest'
import { parsePositiveInt, program } from '../src/index.js'

describe('cli', () => {
  it('rejects partial numbers', () => {
    expect(() => parsePositiveInt('2x')).toThrow('must be a positive number')
  })

  it('keeps reserve as a plan alias', () => {
    const command = program.commands.find(command => command.name() === 'plan')
    expect(command?.aliases()).toContain('reserve')
  })

  it('rejects partial bridge limits', () => {
    const command = program.commands.find(command => command.name() === 'bridge')
    const option = command?.options.find(option => option.long === '--limit')
    expect(() => option?.parseArg?.('2x', undefined)).toThrow('must be a positive number')
  })

  it('keeps unreserve as a release alias', () => {
    const command = program.commands.find(command => command.name() === 'release')
    expect(command?.aliases()).toContain('unreserve')
  })
})
