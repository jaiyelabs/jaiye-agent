import fs from 'fs'
import http from 'http'
import path from 'path'
import { execFile } from 'child_process'
import { getProjectRoot } from './mode.js'
import { getBridgeDir, getHandoffDir } from '../utils/paths.js'

export interface WatchSource {
  label: string
  path: string
  type: 'bridge' | 'handoff' | 'decision' | 'state' | 'task'
  updated: string | null
  content: string
}

export interface WatchSnapshot {
  project: string
  updated: string
  sources: WatchSource[]
}

export interface WatchOptions {
  port?: number
  host?: string
  tasksDir?: string
  open?: boolean
}

export function readWatchSnapshot(options: WatchOptions = {}): WatchSnapshot {
  const root = getProjectRoot()
  const sources = [
    ...readBridgeFiles(root),
    ...readDirectory('handoff', getHandoffDir(), 8),
    ...readDirectory('decision', path.join(root, 'ops', 'decisions'), 8),
    ...readStateFiles(root),
    ...(options.tasksDir ? readDirectory('task', path.resolve(options.tasksDir), 8) : [])
  ]

  return {
    project: path.basename(root),
    updated: new Date().toISOString(),
    sources
  }
}

export function startWatchServer(options: WatchOptions = {}): http.Server {
  const port = options.port ?? 8787
  const host = options.host || '127.0.0.1'
  const clients = new Set<http.ServerResponse>()

  const server = http.createServer((req, res) => {
    if (req.url === '/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      })
      clients.add(res)
      sendEvent(res, readWatchSnapshot(options))
      req.on('close', () => clients.delete(res))
      return
    }

    if (req.url === '/api/snapshot') {
      sendJson(res, readWatchSnapshot(options))
      return
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(renderWatchPage())
  })

  const timer = setInterval(() => {
    const snapshot = readWatchSnapshot(options)
    for (const client of clients) {
      sendEvent(client, snapshot)
    }
  }, 1000)

  server.on('close', () => clearInterval(timer))

  server.listen(port, host, () => {
    if (options.open) {
      openUrl(`http://${host}:${port}`)
    }
  })

  return server
}

function readStateFiles(root: string): WatchSource[] {
  const source = readFileSource('state', path.join(root, '.jaiye', 'state.json'))
  return source ? [source] : []
}

function readBridgeFiles(root: string): WatchSource[] {
  const files = [
    path.join(getBridgeDir(), 'bridge.md'),
    path.join(root, '.jaiye', 'bridge.md')
  ]

  return files
    .filter((file, index) => files.indexOf(file) === index)
    .map(file => readFileSource('bridge', file))
    .filter((source): source is WatchSource => source !== null)
}

function readDirectory(type: WatchSource['type'], dir: string, limit: number): WatchSource[] {
  if (!fs.existsSync(dir)) return []

  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => path.join(dir, entry.name))
    .map(file => ({ file, stat: fs.statSync(file) }))
    .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs)
    .slice(0, limit)
    .map(({ file }) => readFileSource(type, file))
    .filter((source): source is WatchSource => source !== null)
}

function readFileSource(type: WatchSource['type'], file: string): WatchSource | null {
  if (!fs.existsSync(file)) return null
  const stat = fs.statSync(file)

  return {
    label: path.basename(file),
    path: file,
    type,
    updated: stat.mtime.toISOString(),
    content: fs.readFileSync(file, 'utf-8').slice(-12000)
  }
}

function sendJson(res: http.ServerResponse, value: unknown) {
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(value))
}

function sendEvent(res: http.ServerResponse, value: unknown) {
  res.write(`data: ${JSON.stringify(value)}\n\n`)
}

function openUrl(url: string) {
  if (process.platform === 'darwin') {
    execFile('open', [url])
  }
}

function renderWatchPage(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Jaiye Watch</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f2ea;
      --ink: #1f1d1a;
      --muted: #6c655c;
      --line: #d9d0c2;
      --panel: #fffaf2;
      --accent: #245c55;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font: 14px/1.45 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 18px 24px;
      border-bottom: 1px solid var(--line);
      background: #fbf7ef;
      position: sticky;
      top: 0;
      z-index: 2;
    }
    h1 {
      margin: 0;
      font-size: 18px;
      line-height: 1.1;
    }
    .meta {
      color: var(--muted);
      font-size: 13px;
      text-align: right;
    }
    main {
      display: grid;
      grid-template-columns: 280px minmax(0, 1fr);
      min-height: calc(100vh - 69px);
    }
    nav {
      border-right: 1px solid var(--line);
      padding: 16px;
      background: #f0eadf;
      overflow: auto;
    }
    .source-button {
      width: 100%;
      border: 1px solid var(--line);
      background: var(--panel);
      color: var(--ink);
      text-align: left;
      border-radius: 6px;
      padding: 10px;
      margin: 0 0 8px;
      cursor: pointer;
    }
    .source-button.active {
      border-color: var(--accent);
      box-shadow: inset 3px 0 0 var(--accent);
    }
    .source-title {
      display: block;
      font-weight: 650;
      overflow-wrap: anywhere;
    }
    .source-path {
      display: block;
      color: var(--muted);
      font-size: 12px;
      margin-top: 4px;
      overflow-wrap: anywhere;
    }
    section {
      min-width: 0;
      padding: 18px 24px 40px;
    }
    .empty {
      color: var(--muted);
      padding: 24px 0;
    }
    .viewer-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 12px;
    }
    .viewer-head h2 {
      margin: 0;
      font-size: 16px;
      overflow-wrap: anywhere;
    }
    .pill {
      color: #fff;
      background: var(--accent);
      border-radius: 999px;
      padding: 3px 8px;
      font-size: 12px;
      white-space: nowrap;
    }
    pre {
      margin: 0;
      border: 1px solid var(--line);
      background: var(--panel);
      border-radius: 6px;
      padding: 16px;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      min-height: 360px;
    }
    @media (max-width: 780px) {
      header { align-items: flex-start; flex-direction: column; }
      .meta { text-align: left; }
      main { grid-template-columns: 1fr; }
      nav { border-right: 0; border-bottom: 1px solid var(--line); }
    }
  </style>
</head>
<body>
  <header>
    <h1>Jaiye Watch</h1>
    <div class="meta" id="meta">Connecting...</div>
  </header>
  <main>
    <nav id="sources"></nav>
    <section id="viewer"></section>
  </main>
  <script>
    let selected = ''
    let latest = null

    function render(snapshot) {
      latest = snapshot
      document.getElementById('meta').textContent = snapshot.project + ' updated ' + new Date(snapshot.updated).toLocaleTimeString()
      if (!selected && snapshot.sources[0]) selected = snapshot.sources[0].path

      const sources = document.getElementById('sources')
      sources.innerHTML = ''
      snapshot.sources.forEach(source => {
        const button = document.createElement('button')
        button.className = 'source-button' + (source.path === selected ? ' active' : '')
        button.onclick = () => { selected = source.path; render(latest) }
        button.innerHTML = '<span class="source-title">' + escapeHtml(source.label) + '</span><span class="source-path">' + escapeHtml(source.type + ' - ' + source.path) + '</span>'
        sources.appendChild(button)
      })

      const viewer = document.getElementById('viewer')
      const source = snapshot.sources.find(item => item.path === selected)
      if (!source) {
        viewer.innerHTML = '<div class="empty">No watched files yet.</div>'
        return
      }

      viewer.innerHTML = '<div class="viewer-head"><div><h2>' + escapeHtml(source.label) + '</h2><div class="source-path">' + escapeHtml(source.path) + '</div></div><span class="pill">' + escapeHtml(source.type) + '</span></div><pre>' + escapeHtml(source.content || '') + '</pre>'
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[char]))
    }

    const events = new EventSource('/events')
    events.onmessage = event => render(JSON.parse(event.data))
    events.onerror = () => {
      document.getElementById('meta').textContent = 'Disconnected'
    }
  </script>
</body>
</html>`
}
