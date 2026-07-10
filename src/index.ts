import { Command, InvalidArgumentError } from 'commander'
import { readFileSync } from 'fs'
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

export const program = new Command()
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'))

export function parsePositiveInt(value: string) {
  if (!/^\d+$/.test(value)) {
    throw new InvalidArgumentError('must be a positive number')
  }

  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new InvalidArgumentError('must be a positive number')
  }

  return parsed
}

program
  .name('jaiye-agent')
  .description('Multi-agent coordination protocol for AI coding tools')
  .version(pkg.version)

program
  .command('init')
  .description('Initialize jaiye-agent in the current project')
  .action(initCommand)

program
  .command('status')
  .alias('ls')
  .description('Show file ownership and conflicts')
  .action(statusCommand)

program
  .command('handoff')
  .description('Create a structured handoff between agents')
  .requiredOption('--from <agent>', 'Agent handing off')
  .requiredOption('--to <agent>', 'Agent receiving')
  .option('--summary <text>', 'Short summary of the handoff')
  .option('--mode <mode>', 'Context mode')
  .option('--context <text>', 'Context note')
  .action(handoffCommand)

program
  .command('log')
  .alias('history')
  .description('Show handoff history')
  .option('--limit <n>', 'Number of entries', parsePositiveInt, 10)
  .action((opts) => logCommand({ limit: opts.limit }))

program
  .command('check')
  .alias('ci')
  .description('Check for ownership conflicts (CI mode)')
  .option('--base <branch>', 'Base branch to compare against')
  .action(checkCommand)

program
  .command('touch')
  .description('Register that an agent touched files')
  .requiredOption('--agent <agent>', 'Agent name')
  .argument('<files...>', 'Files touched')
  .action((files, opts) => touchCommand({ agent: opts.agent, files }))

program
  .command('sync')
  .alias('refresh')
  .description('Sync .jaiye/state.json from the filesystem')
  .action(syncCommand)

program
  .command('plan')
  .alias('reserve')
  .description('Reserve files before an agent starts work')
  .requiredOption('--agent <agent>', 'Agent name')
  .option('--hours <n>', 'Reservation length in hours', parsePositiveInt, 4)
  .argument('<files...>', 'Files to reserve')
  .action((files, opts) => planCommand({ agent: opts.agent, files, hours: opts.hours }))

program
  .command('release')
  .alias('unreserve')
  .description('Release reserved files')
  .requiredOption('--agent <agent>', 'Agent name')
  .option('--all', 'Release all reservations for agent')
  .argument('[files...]', 'Files to release')
  .action((files, opts) => releaseCommand({ agent: opts.agent, files, all: opts.all }))

program
  .command('bridge')
  .description('Manage a project bridge')
  .option('--between <agents>', 'Agents using the bridge')
  .option('--file <path>', 'Bridge file path')
  .option('--append', 'Append a message')
  .option('--agent <agent>', 'Agent writing the message')
  .option('--message <text>', 'Message text')
  .option('--status <status>', 'Status marker')
  .option('--read', 'Read latest messages')
  .option('--limit <n>', 'Number of messages', parsePositiveInt, 10)
  .option('--archive', 'Archive old DONE messages')
  .option('--older-than <age>', 'Archive age, like 7d', '7d')
  .action(bridgeCommand)

program
  .command('watch')
  .description('Start a live local browser view')
  .option('--port <port>', 'Port to run on', parsePositiveInt, 8787)
  .option('--host <host>', 'Host to bind', '127.0.0.1')
  .option('--tasks-dir <path>', 'Task output directory')
  .option('--open', 'Open in the browser')
  .action(watchCommand)

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  program.parse()
}
