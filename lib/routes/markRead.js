import { requireAuth } from '../auth.js'
import { githubFetch } from '../github/client.js'
import { removeNotification } from '../github/notifications.js'

export async function handleMarkRead (req, res, url) {
  if (!requireAuth(req, res)) return

  const match = url.pathname.match(/^\/notifications\/([^/]+)\/read$/)
  if (!match) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid notification id' }))
    return
  }

  const id = match[1]

  try {
    const { status } = await githubFetch(
      `https://api.github.com/notifications/threads/${id}`,
      { method: 'PATCH' }
    )
    if (status !== 205 && status !== 200) {
      res.writeHead(status, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: `GitHub returned ${status}` }))
      return
    }
  } catch (err) {
    res.writeHead(502, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: err.message }))
    return
  }

  removeNotification(id)

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ ok: true }))
}
