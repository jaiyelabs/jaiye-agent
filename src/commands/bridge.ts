import { appendBridgeMessage, archiveBridge, createBridge, readBridgeMessages } from '../core/bridge.js'
import { success, dim, error } from '../utils/format.js'

export function bridgeCommand(options: {
  between?: string
  file?: string
  append?: boolean
  agent?: string
  message?: string
  status?: string
  read?: boolean
  archive?: boolean
  olderThan?: string
  limit?: number | string
}) {
  if (options.archive) {
    const result = archiveBridge(options.file, options.olderThan)
    console.log(success(`Archived ${result.archived} message${result.archived === 1 ? '' : 's'}`))
    console.log(dim(`${result.active} active message${result.active === 1 ? '' : 's'} left`))
    if (result.archiveFile) console.log(dim(result.archiveFile))
    return
  }

  if (options.append) {
    if (!options.agent || !options.message) {
      console.log(error('Missing required flags: --agent <agent> --message <text>'))
      process.exit(1)
    }

    const file = appendBridgeMessage({
      agent: options.agent,
      timestamp: new Date().toISOString(),
      message: options.message,
      status: options.status
    }, options.file)

    console.log(success('Bridge message appended'))
    console.log(dim(file))
    return
  }

  if (options.read) {
    const limit = options.limit === undefined ? 10 : Number(options.limit)
    if (!Number.isSafeInteger(limit) || limit <= 0) {
      console.log(error('Invalid limit.'))
      process.exit(1)
    }

    const messages = readBridgeMessages(options.file, limit)
    if (messages.length === 0) {
      console.log(dim('No bridge messages found.'))
      return
    }

    console.log(messages.join('\n\n'))
    return
  }

  const file = createBridge(options.file, options.between)
  console.log(success('Bridge ready'))
  console.log(dim(file))
}
