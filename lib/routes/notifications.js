import { requireAuth } from '../auth.js'
import { getFiltered } from '../github/notifications.js'

export function handleNotifications (req, res, url) {
  if (!requireAuth(req, res)) return

  const filters = {}
  const reason = url.searchParams.get('reason')
  if (reason) filters.reason = reason
  const repo = url.searchParams.get('repo')
  if (repo) filters.repo = repo
  const type = url.searchParams.get('type')
  if (type) filters.type = type
  if (url.searchParams.get('includeClosed') === '1') filters.includeClosed = true

  const filtered = getFiltered(filters)

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({
    count: filtered.length,
    notifications: filtered
  }))
}
