import { startWatchServer } from '../core/watch.js'
import { success, dim, error } from '../utils/format.js'

export function watchCommand(options: {
  port?: string
  host?: string
  tasksDir?: string
  open?: boolean
}) {
  const port = parseInt(options.port || '8787')
  const host = options.host || '127.0.0.1'

  const server = startWatchServer({
    port,
    host,
    tasksDir: options.tasksDir,
    open: options.open
  })

  server.on('listening', () => {
    console.log(success('Jaiye watch running'))
    console.log(dim(`http://${host}:${port}`))
  })

  server.on('error', err => {
    console.log(error((err as Error).message))
    process.exit(1)
  })
}
