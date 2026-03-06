#!/usr/bin/env node

import { join } from 'node:path'
import { loadConfig } from '../lib/config.js'
import { init as initClient } from '../lib/github/client.js'
import { init as initAuth } from '../lib/auth.js'
import { init as initCache, flush as flushCache } from '../lib/github/stateCache.js'
import { startServer } from '../lib/server.js'
import { startPolling, stopPolling } from '../lib/github/poller.js'

const config = loadConfig()

initClient(config.githubToken)
initAuth(config.apiTokens)
initCache(join(import.meta.dirname, '..', '.cache', 'state.json'))

const server = startServer(config)
startPolling(config)

function shutdown () {
  console.log('\n[shutdown] Flushing cache...')
  flushCache()
  console.log('[shutdown] Stopping poller...')
  stopPolling()
  console.log('[shutdown] Closing server...')
  server.close(() => {
    console.log('[shutdown] Done')
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
