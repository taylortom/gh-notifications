import { handleHealth } from './routes/health.js'
import { handleNotifications } from './routes/notifications.js'
import { handleFrontend, handleFavicon } from './routes/frontend.js'
import { handleMarkRead } from './routes/markRead.js'

const routes = {
  'GET /': handleFrontend,
  'GET /favicon.png': handleFavicon,
  'GET /health': handleHealth,
  'GET /notifications': handleNotifications
}

export function route (req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const key = `${req.method} ${url.pathname}`
  const handler = routes[key]
  if (handler) {
    handler(req, res, url)
    return
  }

  // Pattern routes
  if (req.method === 'PATCH' && /^\/notifications\/[^/]+\/read$/.test(url.pathname)) {
    handleMarkRead(req, res, url)
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
}
