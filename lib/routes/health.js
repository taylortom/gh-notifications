import { getRateLimitRemaining } from '../github/client.js'
import { getLastPoll } from '../github/poller.js'
import { totalCount } from '../github/notifications.js'
import * as stateCache from '../github/stateCache.js'

const startTime = Date.now()

export function handleHealth (req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({
    status: 'ok',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    lastPoll: getLastPoll(),
    notificationCount: totalCount(),
    cacheSize: stateCache.size(),
    rateLimitRemaining: getRateLimitRemaining()
  }))
}
