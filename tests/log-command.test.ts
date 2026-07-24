import { afterEach, describe, expect, it, vi } from 'vitest'
import { logCommand } from '../src/commands/log.js'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('log command', () => {
  it('rejects invalid direct limits', () => {
    const logs: string[] = []
    vi.spyOn(console, 'log').mockImplementation(message => logs.push(String(message)))
    vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit')
    }) as never)

    expect(() => logCommand({ limit: '2x' })).toThrow('exit')
    expect(logs[0]).toContain('Invalid limit.')
  })

  it('rejects empty direct limits', () => {
    const logs: string[] = []
    vi.spyOn(console, 'log').mockImplementation(message => logs.push(String(message)))
    vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit')
    }) as never)

    expect(() => logCommand({ limit: '' })).toThrow('exit')
    expect(logs[0]).toContain('Invalid limit.')
  })
})
