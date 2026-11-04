import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { headersForPath, parseHeaderRules, startSecurityPreview } from '../scripts/security-preview.mjs'

const source = readFileSync('public/_headers', 'utf8')

describe('security header policy', () => {
  it('enforces a complete same-origin policy without script exceptions', () => {
    const lines = source.split(/\r?\n/)
    expect(lines[0]).toBe('/*')
    const policies = lines.filter(line => line.trimStart().startsWith('Content-Security-Policy:'))
    expect(policies).toHaveLength(1)
    const directives = Object.fromEntries(policies[0]!.split(':').slice(1).join(':').split(';').map(value => {
      const [name, ...sources] = value.trim().split(/\s+/)
      return [name, sources]
    }))
    expect(directives).toEqual({
      'default-src': ["'self'"], 'script-src': ["'self'"], 'style-src': ["'self'"],
      'img-src': ["'self'"], 'font-src': ["'self'"], 'connect-src': ["'self'"],
      'worker-src': ["'self'"], 'manifest-src': ["'self'"], 'object-src': ["'none'"],
      'base-uri': ["'none'"], 'form-action': ["'none'"], 'frame-ancestors': ["'none'"], 'frame-src': ["'none'"],
    })
    expect(source).not.toMatch(/unsafe-inline|unsafe-eval|Report-Only|data:|blob:/)
    for (const header of ['X-Frame-Options: DENY', 'X-Content-Type-Options: nosniff', 'Referrer-Policy: no-referrer']) {
      expect(lines.filter(line => line.trim() === header)).toHaveLength(1)
    }
  })

  it('preserves exact-path update caching rules', () => {
    for (const path of ['/sw.js', '/manifest.webmanifest']) {
      expect(source).toContain(`${path}\n  Cache-Control: no-cache`)
    }
  })
})

describe('security preview rules', () => {
  it('merges global security headers with exact-path caching without leaking it to other assets', () => {
    const rules = parseHeaderRules(source)
    const global = headersForPath(rules, '/assets/app.js')
    expect(global).toMatchObject({
      'x-frame-options': 'DENY', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer',
    })
    expect(global['content-security-policy']).toContain("worker-src 'self'")
    expect(global).not.toHaveProperty('cache-control')
    for (const path of ['/sw.js', '/manifest.webmanifest']) {
      expect(headersForPath(rules, path)).toEqual({ ...global, 'cache-control': 'no-cache' })
    }
    expect(headersForPath(rules, '/sw.js/other')).toEqual(global)
  })

  it.each([
    ['', 'global security'],
    ['  X-Frame-Options: DENY', 'without a path'],
    [source.replace('/*', '/assets/*'), 'unsupported path'],
    [source.replace('/*', 'https://example.test/*'), 'unsupported path'],
    [source.replace('/sw.js', '/a/../sw.js'), 'unsupported path'],
    [source.replace('/sw.js', '//sw.js'), 'unsupported path'],
    [source.replace('  Cache-Control: no-cache', '  ! Cache-Control'), 'expected Header'],
    [source.replace('Referrer-Policy: no-referrer', 'Referrer-Policy:'), 'empty header'],
    [source.replace('Referrer-Policy: no-referrer', 'Content-Type: text/plain'), 'unsupported'],
    [source.replace('  X-Frame-Options: DENY', '  X-Frame-Options: DENY\n  x-frame-options: DENY'), 'duplicate header'],
    [source + '\n/sw.js\n  Cache-Control: no-cache', 'duplicate path'],
    [source + '\n/empty', 'empty rule'],
    [source + '\n/other\n  X-Frame-Options: SAMEORIGIN', 'conflicting header'],
    [source.replace('  Referrer-Policy: no-referrer\n', ''), 'global security'],
    [source.replace('DENY', 'DENY\u0000'), 'Invalid character'],
  ])('rejects invalid rules instead of serving without protection (%#)', (invalid, reason) => {
    expect(() => parseHeaderRules(invalid)).toThrow(reason)
  })

  it('accepts comments, CRLF and a matching exact-path header', () => {
    const rules = parseHeaderRules(('# security rules\n' + source + '\n/matching\n  X-Frame-Options: DENY').replaceAll('\n', '\r\n'))
    expect(headersForPath(rules, '/matching')).toEqual(headersForPath(rules, '/'))
  })

  it('refuses to start when built rules are missing', async () => {
    await expect(startSecurityPreview({ rulesPath: 'dist/nonexistent-security-rules' })).rejects.toThrow('ENOENT')
  })
})
