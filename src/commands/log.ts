import { listHandoffs } from '../core/handoffs.js'
import { heading, dim, createTable, error } from '../utils/format.js'

export function logCommand(options: { limit?: number | string }) {
  const limit = options.limit === undefined ? 10 : Number(options.limit)
  if (!Number.isSafeInteger(limit) || limit <= 0) {
    console.log(error('Invalid limit.'))
    process.exit(1)
  }

  const handoffs = listHandoffs().slice(0, limit)

  if (handoffs.length === 0) {
    console.log(dim('No handoffs found.'))
    return
  }

  console.log(heading('jaiye-agent log'))
  console.log()

  const table = createTable(['Date', 'From', 'To', 'Status', 'Summary'])

  for (const h of handoffs) {
    const date = h.timestamp
      ? new Date(h.timestamp).toLocaleDateString()
      : h.id

    table.push([
      date,
      h.from,
      h.to,
      h.status,
      h.summary.slice(0, 50)
    ])
  }

  console.log(table.toString())
}
