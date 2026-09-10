import { Command, InvalidArgumentError } from 'commander'
import { readFileSync } from 'fs'
import { isIP } from 'net'
import { pathToFileURL } from 'url'
import { initCommand } from './commands/init.js'
import { statusCommand } from './commands/status.js'
import { handoffCommand } from './commands/handoff.js'
import { logCommand } from './commands/log.js'
import { checkCommand } from './commands/check.js'
import { touchCommand } from './commands/touch.js'
import { syncCommand } from './commands/sync.js'
import { bridgeCommand } from './commands/bridge.js'
import { watchCommand } from './commands/watch.js'
import { planCommand } from './commands/plan.js'
import { releaseCommand } from './commands/release.js'
import { error } from './utils/format.js'

export const program = new Command()
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'))

export function parsePositiveInt(value: string) {
  if (value.trim() !== value) {
    throw new InvalidArgumentError('must be a positive number')
  }

  if (!/^\+?\d+$/.test(value)) {
    throw new InvalidArgumentError('must be a positive number')
  }

  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new InvalidArgumentError('must be a positive number')
  }

  return parsed
}

export function parsePort(value: string) {
  if (value.trim() !== value) {
    throw new InvalidArgumentError('must be a valid port')
  }

  if (!/^\d+$/.test(value)) {
    throw new InvalidArgumentError('must be a valid port')
  }

  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > 65535) {
    throw new InvalidArgumentError('must be a valid port')
  }

  return parsed
}

export function parseHost(value: string) {
  if (value.trim() !== value || value.length === 0) {
    throw new InvalidArgumentError('must be a valid host')
  }

  if (/\s/.test(value)) {
    throw new InvalidArgumentError('must be a valid host')
  }

  const hasUrlParts = value.includes('://') || value.includes('/') || value.includes('\\') || value.includes('?') || value.includes('#')
  const ipVersion = isIP(value)
  const hasBadColon = value.includes(':') && ipVersion !== 6
  const hasBadDots = value.includes('..') || value.startsWith('.') || value.endsWith('.')
  const hasBadIpv4 = ipVersion === 0 && /^\d+\.\d+\.\d+\.\d+$/.test(value)
  const hasBadChars = ipVersion === 0 && value.split('.').some(part => !/^[a-zA-Z0-9-]+$/.test(part))
  const hasBadLabel = ipVersion === 0 && value.split('.').some(part => part.startsWith('-') || part.endsWith('-'))
  const hasLongLabel = ipVersion === 0 && value.split('.').some(part => part.length > 63)
  const hasLongHost = ipVersion === 0 && value.length > 253

  if (hasUrlParts || hasBadColon || hasBadDots || hasBadIpv4 || hasBadChars || hasBadLabel || hasLongLabel || hasLongHost) {
    throw new InvalidArgumentError('must be a valid host')
  }

  return value
}

export function parseRef(value: string) {
  if (value.trim() !== value || value.length === 0) {
    throw new InvalidArgumentError('must be a valid ref')
  }

  const hasBadParts = value.includes('..') || value.includes('//') || value.includes('@{') || value.startsWith('/') || value.endsWith('/') || value.endsWith('.') || value === '@'
  const hasBadPath = value.split('/').some(part => part.startsWith('.') || part.endsWith('.') || part.endsWith('.lock'))
  const hasBadChars = /[\s~^:?*[\\]/.test(value)

  if (hasBadParts || hasBadPath || hasBadChars) {
    throw new InvalidArgumentError('must be a valid ref')
  }

  return value
}

export function parseAge(value: string) {
  if (!/^\d+[dhm]$/.test(value)) {
    throw new InvalidArgumentError('must be a valid age')
  }

  const amount = Number(value.slice(0, -1))
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new InvalidArgumentError('must be a valid age')
  }

  return value
}

program
  .name('jaiye-agent')
  .description('Multi-agent coordination protocol for AI coding tools')
  .version(pkg.version)

program
  .command('init')
  .description('Initialize jaiye-agent in the current project')
  .option('-s, --scan', 'Infer ownership rules from the project structure')
  .allowExcessArguments(false)
  .action(initCommand)

program
  .command('status')
  .alias('ls')
  .description('Show file ownership and conflicts')
  .option('-a, --all', 'Show all tracked files')
  .option('-r, --reserved', 'Show only reserved files')
  .option('-g, --agent <agent>', 'Show files for one agent')
  .allowExcessArguments(false)
  .action(statusCommand)

program
  .command('handoff')
  .alias('pass')
  .description('Create a structured handoff between agents')
  .requiredOption('-f, --from <agent>', 'Agent handing off')
  .requiredOption('-t, --to <agent>', 'Agent receiving')
  .option('-s, --summary <text>', 'Short summary of the handoff')
  .option('-M, --mode <mode>', 'Context mode')
  .option('-c, --context <text>', 'Context note')
  .allowExcessArguments(false)
  .action(handoffCommand)

program
  .command('log')
  .alias('history')
  .description('Show handoff history')
  .option('-n, --limit <n>', 'Number of entries', parsePositiveInt, 10)
  .allowExcessArguments(false)
  .action((opts) => logCommand({ limit: opts.limit }))

program
  .command('check')
  .alias('ci')
  .description('Check for ownership conflicts (CI mode)')
  .option('-b, --base <branch>', 'Base branch to compare against', parseRef)
  .allowExcessArguments(false)
  .action(checkCommand)

program
  .command('touch')
  .alias('mark')
  .description('Register that an agent touched files')
  .requiredOption('-g, --agent <agent>', 'Agent name')
  .argument('<files...>', 'Files touched')
  .action((files, opts) => touchCommand({ agent: opts.agent, files }))

program
  .command('sync')
  .alias('refresh')
  .description('Sync .jaiye/state.json from the filesystem')
  .allowExcessArguments(false)
  .action(syncCommand)

program
  .command('plan')
  .alias('reserve')
  .description('Reserve files before an agent starts work')
  .requiredOption('-g, --agent <agent>', 'Agent name')
  .option('-H, --hours <n>', 'Reservation length in hours', parsePositiveInt, 4)
  .argument('<files...>', 'Files to reserve')
  .action((files, opts) => planCommand({ agent: opts.agent, files, hours: opts.hours }))

program
  .command('release')
  .alias('unreserve')
  .alias('free')
  .description('Release reserved files')
  .requiredOption('-g, --agent <agent>', 'Agent name')
  .option('-a, --all', 'Release all reservations for agent')
  .argument('[files...]', 'Files to release')
  .action((files, opts) => {
    if (opts.all && files.length > 0) {
      console.log(error('Do not pass files with --all.'))
      process.exit(1)
    }

    releaseCommand({ agent: opts.agent, files, all: opts.all })
  })

program
  .command('bridge')
  .alias('board')
  .description('Manage a project bridge')
  .option('-B, --between <agents>', 'Agents using the bridge')
  .option('-f, --file <path>', 'Bridge file path')
  .option('-A, --append', 'Append a message')
  .option('-g, --agent <agent>', 'Agent writing the message')
  .option('-m, --message <text>', 'Message text')
  .option('-s, --status <status>', 'Status marker')
  .option('-R, --read', 'Read latest messages')
  .option('-n, --limit <n>', 'Number of messages', parsePositiveInt, 10)
  .option('--archive', 'Archive old DONE messages')
  .option('--older-than <age>', 'Archive age, like 7d', parseAge, '7d')
  .allowExcessArguments(false)
  .action(bridgeCommand)

program
  .command('watch')
  .alias('view')
  .description('Start a live local browser view')
  .option('-p, --port <port>', 'Port to run on', parsePort, 8787)
  .option('-H, --host <host>', 'Host to bind', parseHost, '127.0.0.1')
  .option('-d, --tasks-dir <path>', 'Task output directory')
  .option('-o, --open', 'Open in the browser')
  .allowExcessArguments(false)
  .action(watchCommand)

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  program.parse()
}
