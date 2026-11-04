export type HeaderRules = Map<string, Map<string, string>>
export function parseHeaderRules(source: string): HeaderRules
export function headersForPath(rules: HeaderRules, pathname: string): Record<string, string>
export function startSecurityPreview(options?: { rulesPath?: string; port?: number }): Promise<import('vite').PreviewServer>
