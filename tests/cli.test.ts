import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'
import { parsePositiveInt, program } from '../src/index.js'

describe('cli', () => {
  it('rejects partial numbers', () => {
    expect(() => parsePositiveInt('2x')).toThrow('must be a positive number')
  })

  it('accepts plus-prefixed positive numbers', () => {
    expect(parsePositiveInt('+2')).toBe(2)
  })

  it('keeps reserve as a plan alias', () => {
    const command = program.commands.find(command => command.name() === 'plan')
    expect(command?.aliases()).toContain('reserve')
  })

  it('rejects unsafe numbers', () => {
    expect(() => parsePositiveInt('9007199254740992')).toThrow('must be a positive number')
  })

  it('uses the package version', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'))
    expect(program.version()).toBe(pkg.version)
  })

  it('keeps ls as a status alias', () => {
    const command = program.commands.find(command => command.name() === 'status')
    expect(command?.aliases()).toContain('ls')
  })

  it('keeps ci as a check alias', () => {
    const command = program.commands.find(command => command.name() === 'check')
    expect(command?.aliases()).toContain('ci')
  })

  it('keeps history as a log alias', () => {
    const command = program.commands.find(command => command.name() === 'log')
    expect(command?.aliases()).toContain('history')
  })

  it('keeps refresh as a sync alias', () => {
    const command = program.commands.find(command => command.name() === 'sync')
    expect(command?.aliases()).toContain('refresh')
  })

  it('keeps mark as a touch alias', () => {
    const command = program.commands.find(command => command.name() === 'touch')
    expect(command?.aliases()).toContain('mark')
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

  it('keeps view as a watch alias', () => {
    const command = program.commands.find(command => command.name() === 'watch')
    expect(command?.aliases()).toContain('view')
  })

  it('keeps board as a bridge alias', () => {
    const command = program.commands.find(command => command.name() === 'bridge')
    expect(command?.aliases()).toContain('board')
  })
})
