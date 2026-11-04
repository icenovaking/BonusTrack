import { readFile } from 'node:fs/promises'
import { validateHeaderName, validateHeaderValue } from 'node:http'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const required = ['content-security-policy', 'x-frame-options', 'x-content-type-options', 'referrer-policy']
const supported = new Set([...required, 'cache-control'])

// Deliberately supports only the global and exact-path rules used by this project.
// Cloudflare remains the authority for deployed response behavior.
export function parseHeaderRules(source) {
  const rules = new Map()
  let current
  for (const [index, raw] of source.split(/\r?\n/).entries()) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const fail = message => { throw new Error(`_headers line ${index + 1}: ${message}`) }
    if (!/^\s/.test(raw)) {
      if (line !== '/*' && (!/^\/[a-zA-Z0-9._/-]+$/.test(line) || line.includes('//') || line.split('/').some(part => part === '.' || part === '..'))) {
        fail('unsupported path rule')
      }
      if (rules.has(line)) fail('duplicate path rule')
      current = new Map()
      rules.set(line, current)
      continue
    }
    if (!current) fail('header without a path rule')
    const separator = line.indexOf(':')
    if (separator < 1) fail('expected Header: value')
    const name = line.slice(0, separator).toLowerCase()
    const value = line.slice(separator + 1).trim()
    validateHeaderName(name)
    validateHeaderValue(name, value)
    if (!supported.has(name) || !value) fail('unsupported or empty header')
    if (current.has(name)) fail('duplicate header')
    current.set(name, value)
  }
  const global = rules.get('/*')
  if (!global || required.some(name => !global.get(name))) throw new Error('_headers requires global security headers')
  for (const [path, headers] of rules) {
    if (!headers.size) throw new Error(`_headers empty rule: ${path}`)
    if (path !== '/*') for (const [name, value] of headers) {
      if (global.has(name) && global.get(name) !== value) throw new Error(`_headers conflicting header: ${name}`)
    }
  }
  return rules
}

export function headersForPath(rules, pathname) {
  return Object.fromEntries([...rules.get('/*'), ...(rules.get(pathname) ?? [])])
}

export async function startSecurityPreview({ rulesPath = resolve('dist/_headers'), port = 4173 } = {}) {
  const rules = parseHeaderRules(await readFile(rulesPath, 'utf8'))
  const { preview } = await import('vite')
  return preview({
    preview: { host: 'localhost', port, strictPort: true, open: false },
    plugins: [{
      name: 'security-preview-headers',
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          const pathname = new URL(req.url ?? '/', 'http://localhost').pathname
          for (const [name, value] of Object.entries(headersForPath(rules, pathname))) res.setHeader(name, value)
          next()
        })
      },
    }],
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  startSecurityPreview().then(server => {
    server.printUrls()
    const close = () => { void server.close().then(() => process.exit(0)) }
    process.once('SIGINT', close)
    process.once('SIGTERM', close)
  }).catch(error => {
    console.error(`Security preview failed: ${error.message}`)
    process.exitCode = 1
  })
}
