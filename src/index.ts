import { Command } from 'commander'
import { initCommand } from './commands/init.js'
import { statusCommand } from './commands/status.js'
import { handoffCommand } from './commands/handoff.js'
import { logCommand } from './commands/log.js'
import { checkCommand } from './commands/check.js'

const program = new Command()

program
  .name('jaiye-agent')
  .description('Multi-agent coordination protocol for AI coding tools')
  .version('0.1.0')

program
  .command('init')
  .description('Initialize jaiye-agent in the current repo')
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

program.parse()
