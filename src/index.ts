import { Command, InvalidArgumentError } from 'commander'
import { existsSync, readFileSync, realpathSync } from 'fs'
import { isIP } from 'net'
import { fileURLToPath } from 'url'
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

  if (!/^\+?[1-9]\d*$/.test(value)) {
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

  if (value.length > 1 && value.startsWith('0')) {
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

export function parseAgent(value: string) {
  if (value.trim() !== value || value.length === 0 || value.startsWith('-') || value.includes(',') || value.includes('/') || value.includes('\\') || /\s/.test(value) || /[\x00-\x1f\x7f]/.test(value)) {
    throw new InvalidArgumentError('must be a valid agent')
  }

  return value
}

export function parseBridgeStatus(value: string) {
  if (value.trim() !== value || value.length === 0 || /[\x00-\x1f\x7f]/.test(value)) {
    throw new InvalidArgumentError('must be a valid status')
  }

  return value
}

export function parseBridgeBetween(value: string) {
  const agents = value.split(',')
  const hasTooFewAgents = agents.length < 2
  const hasEmptyAgent = agents.some(agent => agent.length === 0)
  const hasDuplicateAgent = new Set(agents).size !== agents.length
  const hasFlagAgent = agents.some(agent => agent.startsWith('-'))
  const hasPathAgent = agents.some(agent => agent.includes('/') || agent.includes('\\'))
  if (value.trim() !== value || value.length === 0 || hasTooFewAgents || hasEmptyAgent || hasDuplicateAgent || hasFlagAgent || hasPathAgent || /\s/.test(value) || /[\x00-\x1f\x7f]/.test(value)) {
    throw new InvalidArgumentError('must be valid agents')
  }

  return value
}

export function parseMode(value: string) {
  if (value.trim() !== value || value.length === 0 || value.startsWith('-') || /\s/.test(value) || /[\x00-\x1f\x7f]/.test(value)) {
    throw new InvalidArgumentError('must be a valid mode')
  }

  return value
}

export function parseRef(value: string) {
  if (value.trim() !== value || value.length === 0) {
    throw new InvalidArgumentError('must be a valid ref')
  }

  const hasBadParts = value.includes('..') || value.includes('//') || value.includes('@{') || value.startsWith('/') || value.endsWith('/') || value.endsWith('.')
  const hasBadPath = value.startsWith('-') || value.split('/').some(part => part.startsWith('.') || part.endsWith('.lock'))
  const hasBadChars = /[\x00-\x20\x7f~^:?*[\\]/.test(value)

  if (hasBadParts || hasBadPath || hasBadChars) {
    throw new InvalidArgumentError('must be a valid ref')
  }

  return value
}

export function parseAge(value: string) {
  if (value.trim() !== value) {
    throw new InvalidArgumentError('must be a valid age')
  }

  if (!/^[1-9]\d*[dhm]$/.test(value)) {
    throw new InvalidArgumentError('must be a valid age')
  }

  const amount = Number(value.slice(0, -1))
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new InvalidArgumentError('must be a valid age')
  }

  const unit = value.at(-1)
  const milliseconds = unit === 'd' ? 24 * 60 * 60 * 1000 : unit === 'h' ? 60 * 60 * 1000 : 60 * 1000
  if (Number.isNaN(new Date(Date.now() - amount * milliseconds).getTime())) {
    throw new InvalidArgumentError('must be a valid age')
  }

  return value
}

export function parsePath(value: string) {
  if (value.trim() !== value || value.length === 0 || /[\x00-\x1f\x7f]/.test(value)) {
    throw new InvalidArgumentError('must be a valid path')
  }

  return value
}

program
  .name('jaiye-agent')
  .description('Multi-agent coordination protocol for AI coding tools')
  .version(pkg.version)
  .showSuggestionAfterError()
  .showHelpAfterError()

program
  .command('init')
  .alias('setup')
  .description('Initialize jaiye-agent in the current project')
  .option('-s, --scan', 'Infer ownership rules from the project structure')
  .allowExcessArguments(false)
  .action(initCommand)

program
  .command('status')
  .alias('ls')
  .alias('st')
  .alias('owners')
  .alias('who')
  .description('Show file ownership and conflicts')
  .option('-a, --all', 'Show all known files')
  .option('-r, --reserved', 'Show only reserved files')
  .option('-g, --agent <agent>', 'Show files for one agent', parseAgent)
  .addHelpText('after', '\nExamples:\n  jaiye-agent status --all\n  jaiye-agent status --reserved --agent codex\n')
  .allowExcessArguments(false)
  .action(statusCommand)

program
  .command('handoff')
  .alias('pass')
  .alias('send')
  .description('Create a structured handoff between agents')
  .requiredOption('-f, --from <agent>', 'Agent handing off', parseAgent)
  .requiredOption('-t, --to <agent>', 'Agent receiving', parseAgent)
  .option('-s, --summary <text>', 'Short summary of the handoff')
  .option('-M, --mode <mode>', 'Context mode', parseMode)
  .option('-c, --context <text>', 'Context note')
  .allowExcessArguments(false)
  .action(handoffCommand)

program
  .command('log')
  .alias('history')
  .alias('handoffs')
  .description('Show handoff history. Use --all to show every handoff.')
  .option('-n, --limit <n>', 'Number of entries')
  .option('-a, --all', 'Show all handoffs (ignores --limit)')
  .addHelpText('after', '\nExamples:\n  jaiye-agent log --all\n')
  .allowExcessArguments(false)
  .action((opts) => logCommand({ limit: opts.all ? Number.MAX_SAFE_INTEGER : opts.limit === undefined ? 10 : parsePositiveInt(opts.limit) }))

program
  .command('check')
  .alias('ci')
  .alias('verify')
  .alias('audit')
  .alias('conflicts')
  .description('Check for ownership conflicts (CI mode)')
  .option('-b, --base <branch>', 'Base branch to compare against', parseRef)
  .allowExcessArguments(false)
  .action(checkCommand)

program
  .command('touch')
  .alias('mark')
  .description('Register that an agent touched files')
  .requiredOption('-g, --agent <agent>', 'Agent name', parseAgent)
  .argument('<files...>', 'Files touched', parsePath)
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
  .alias('claim')
  .description('Reserve files before an agent starts work')
  .requiredOption('-g, --agent <agent>', 'Agent name', parseAgent)
  .option('-H, --hours <n>', 'Reservation length in hours', (value) => {
    const hours = parsePositiveInt(value)
    if (Number.isNaN(new Date(Date.now() + hours * 60 * 60 * 1000).getTime())) {
      throw new InvalidArgumentError('must be a valid reservation length')
    }
    return hours
  }, 4)
  .argument('<files...>', 'Files to reserve', parsePath)
  .action((files, opts) => planCommand({ agent: opts.agent, files, hours: opts.hours }))

program
  .command('release')
  .alias('unreserve')
  .alias('unclaim')
  .alias('free')
  .description('Release reserved files')
  .requiredOption('-g, --agent <agent>', 'Agent name', parseAgent)
  .option('-a, --all', 'Release all reservations for agent')
  .argument('[files...]', 'Files to release', parsePath)
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
  .alias('messages')
  .alias('msg')
  .alias('inbox')
  .alias('tail')
  .description('Manage a project bridge')
  .option('-B, --between <agents>', 'Agents using the bridge', parseBridgeBetween)
  .option('-f, --file <path>', 'Bridge file path', parsePath)
  .option('-A, --append', 'Append a message')
  .option('-g, --agent <agent>', 'Agent writing the message', parseAgent)
  .option('-m, --message <text>', 'Message text')
  .option('-s, --status <status>', 'Status marker', parseBridgeStatus)
  .option('-R, --read', 'Read latest messages')
  .option('-T, --tail', 'Read latest messages')
  .option('-n, --limit <n>', 'Number of messages', parsePositiveInt, 10)
  .option('--all', 'Read every message')
  .option('-a, --archive', 'Archive old DONE messages')
  .option('-O, --older-than <age>', 'Archive age, like 7d', parseAge, '7d')
  .addHelpText('after', '\nExamples:\n  jaiye-agent bridge --read --all\n')
  .allowExcessArguments(false)
  .action((opts, command) => bridgeCommand({
    ...opts,
    read: opts.read || opts.all || command.parent?.args[0] === 'inbox',
    tail: opts.tail || command.parent?.args[0] === 'tail',
    limit: opts.all ? Number.MAX_SAFE_INTEGER : opts.limit
  }))

program
  .command('watch')
  .alias('view')
  .alias('serve')
  .alias('live')
  .description('Start a live local browser view')
  .option('-p, --port <port>', 'Port to run on', parsePort, 8787)
  .option('-H, --host <host>', 'Host to bind', parseHost, '127.0.0.1')
  .option('-d, --tasks-dir <path>', 'Task output directory', parsePath)
  .option('-o, --open', 'Open in the browser')
  .allowExcessArguments(false)
  .action(watchCommand)

if (process.argv[1] && existsSync(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  program.parse()
}
