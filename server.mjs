import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(__dirname, 'dist')
const STATE_FILE = path.join(__dirname, 'sync-state.json')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8',
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
  } catch {
    return {}
  }
}

function writeState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
}

function send(res, status, body, type) {
  res.writeHead(status, { 'Content-Type': type || 'application/json; charset=utf-8' })
  res.end(body)
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost')

  if (url.pathname === '/api/state' && req.method === 'GET') {
    return send(res, 200, JSON.stringify(readState()))
  }

  if (url.pathname === '/api/state' && req.method === 'PUT') {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > 2_000_000) req.destroy()
    })
    req.on('end', () => {
      try {
        writeState(JSON.parse(body || '{}'))
        send(res, 200, '{"ok":true}')
      } catch {
        send(res, 400, '{"ok":false}')
      }
    })
    return
  }

  let filePath = path.normalize(path.join(DIST, decodeURIComponent(url.pathname)))
  if (!filePath.startsWith(DIST)) return send(res, 403, 'Forbidden', 'text/plain')
  if (filePath === DIST || filePath.endsWith(path.sep)) filePath = path.join(DIST, 'index.html')

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html')
    }
    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        if (!path.extname(filePath)) {
          return fs.readFile(path.join(DIST, 'index.html'), (fallbackErr, html) => {
            if (fallbackErr) return send(res, 404, 'Not Found', 'text/plain')
            send(res, 200, html, MIME['.html'])
          })
        }
        return send(res, 404, 'Not Found', 'text/plain')
      }
      send(res, 200, data, MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream')
    })
  })
})

server.listen(5173, '0.0.0.0', () => {
  console.log('Seoul Trip Planner server: http://0.0.0.0:5173')
})
