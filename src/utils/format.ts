import chalk from 'chalk'
import Table from 'cli-table3'

export function heading(text: string): string {
  return chalk.bold(text)
}

export function success(text: string): string {
  return chalk.green(text)
}

export function warn(text: string): string {
  return chalk.yellow(text)
}

export function error(text: string): string {
  return chalk.red(text)
}

export function dim(text: string): string {
  return chalk.dim(text)
}

export function createTable(head: string[]): Table.Table {
  return new Table({
    head: head.map(h => chalk.bold(h)),
    style: { head: [], border: [] }
  })
}
