import { loadConfig } from '../core/config.js'
import { syncState } from '../core/state.js'
import { success, dim } from '../utils/format.js'

export function syncCommand() {
  const config = loadConfig()
  const state = syncState(config)
  const count = Object.keys(state.files).length

  console.log(success(`Synced ${count} file${count === 1 ? '' : 's'}`))
  console.log(dim('.jaiye/state.json updated'))
}
