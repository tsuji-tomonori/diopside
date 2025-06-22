export interface AppConfig {
  NEXT_PUBLIC_API_URL: string
}

/**
 * Load runtime configuration from public/config.json
 */
export async function loadConfig(): Promise<AppConfig> {
  const res = await fetch('/config.json', { cache: 'no-cache' })
  if (!res.ok) {
    throw new Error(`Failed to load config: ${res.status} ${res.statusText}`)
  }
  return res.json()
}
