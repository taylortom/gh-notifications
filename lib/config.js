function requireEnv (name) {
  const val = process.env[name]
  if (!val) {
    console.error(`Fatal: missing required environment variable ${name}`)
    process.exit(1)
  }
  return val
}

export function loadConfig () {
  const config = {
    githubToken: requireEnv('GH_NOTIFICATIONS_TOKEN'),
    apiTokens: new Set(
      requireEnv('API_TOKENS').split(',').map(t => t.trim()).filter(Boolean)
    ),
    port: parseInt(process.env.PORT || '3000', 10),
    pollInterval: parseInt(process.env.POLL_INTERVAL || '60', 10),
    openStateTtl: parseInt(process.env.OPEN_STATE_TTL || '300', 10),
    concurrencyLimit: 5
  }
  if (config.pollInterval < 10) throw new Error('POLL_INTERVAL must be >= 10')
  if (config.port < 1 || config.port > 65535) throw new Error('Invalid PORT')
  if (config.apiTokens.size === 0) throw new Error('API_TOKENS must contain at least one token')
  return config
}
