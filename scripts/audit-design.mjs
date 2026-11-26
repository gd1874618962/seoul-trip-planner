import fs from 'node:fs'
import path from 'node:path'

const roots = ['src', 'tailwind.config.js']
const files = []

function collect(target) {
  const stat = fs.statSync(target)
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(target)) collect(path.join(target, entry))
    return
  }
  if (/\.(jsx?|css)$/.test(target)) files.push(target)
}

roots.forEach(collect)

const checks = [
  ['arbitrary-type', /text-\[[^\]]+\]/g],
  ['arbitrary-spacing', /\b(?:p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|space-[xy])-\[[^\]]+\]/g],
  ['letter-spacing', /tracking-\[[^\]]+\]|letter-spacing\s*:\s*[^0;\s][^;]*/g],
  ['legacy-color', /(?:text|bg|border)-(?:slate|gold|blue|sage|coral|mist)\b/g],
  ['heavy-shadow', /shadow-(?:card|md|lg|xl|2xl)\b/g],
  ['raw-color-in-jsx', /(?:bg|text|border)-\[#[0-9a-f]{3,8}\]/gi],
  ['responsive-custom-type', /\b(?:sm|md|lg|xl|2xl):type-(?:display|h|body|small|caption)[a-z0-9-]*/g],
]

const findings = []

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8')
  for (const [name, pattern] of checks) {
    for (const match of source.matchAll(pattern)) {
      const line = source.slice(0, match.index).split('\n').length
      findings.push(`${file}:${line} ${name}: ${match[0]}`)
    }
  }
}

if (findings.length) {
  console.error(findings.join('\n'))
  process.exit(1)
}

console.log(`Design audit passed across ${files.length} source files.`)
