import { spawn } from 'node:child_process'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const host = '0.0.0.0'
const port = 5173
const lanAddresses = Object.values(os.networkInterfaces())
  .flat()
  .filter((item) => item && item.family === 'IPv4' && !item.internal)
  .map((item) => item.address)
const lanAddress =
  lanAddresses.find((address) => address.startsWith('192.168.')) ||
  lanAddresses.find((address) => address.startsWith('10.')) ||
  lanAddresses[0] ||
  '127.0.0.1'

function isListening() {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port })
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('error', () => resolve(false))
  })
}

if (!(await isListening())) {
  const child = spawn(process.execPath, ['server.mjs'], {
    cwd: root,
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  })
  child.unref()
  await new Promise((resolve) => setTimeout(resolve, 900))
}

const ready = await isListening()
console.log(`Preview ${ready ? 'ready' : 'failed'}: http://${lanAddress}:${port}/`)
console.log(`Listening: ${ready ? `${host}:${port}` : 'not available'}`)
