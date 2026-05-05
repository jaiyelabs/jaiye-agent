import { Command } from 'commander'
import { initCommand } from './commands/init.js'
import { statusCommand } from './commands/status.js'
import { handoffCommand } from './commands/handoff.js'
import { logCommand } from './commands/log.js'
import { checkCommand } from './commands/check.js'
import { touchCommand } from './commands/touch.js'
import { syncCommand } from './commands/sync.js'
import { bridgeCommand } from './commands/bridge.js'

const program = new Command()

program
  .name('jaiye-agent')
  .description('Multi-agent coordination protocol for AI coding tools')
  .version('0.1.0')

program
  .command('init')
  .description('Initialize jaiye-agent in the current project')
  .action(initCommand)

program
  .command('status')
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
  .description('Show handoff history')
  .option('--limit <n>', 'Number of entries', '10')
  .action((opts) => logCommand({ limit: parseInt(opts.limit) }))

program
  .command('check')
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
  .description('Sync .jaiye/state.json from the filesystem')
  .action(syncCommand)

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
  .option('--limit <n>', 'Number of messages', '10')
  .option('--archive', 'Archive old DONE messages')
  .option('--older-than <age>', 'Archive age, like 7d', '7d')
  .action(bridgeCommand)

program.parse()
