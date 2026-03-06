import { githubFetch, parseLinkHeader } from './client.js'
import { mergeNotifications, resolveSubjectStates } from './notifications.js'

const NOTIFICATIONS_URL = 'https://api.github.com/notifications'

let lastModified = null
let lastPoll = null
let pollInterval = null
let timerId = null
let config = null

export function getLastPoll () {
  return lastPoll
}

export function startPolling (cfg) {
  config = cfg
  pollInterval = cfg.pollInterval
  pollLoop()
}

export function stopPolling () {
  if (timerId) clearTimeout(timerId)
  timerId = null
}

async function pollLoop () {
  try {
    await poll()
  } catch (err) {
    console.error(`[poller] Error: ${err.message}`)
  }
  timerId = setTimeout(pollLoop, pollInterval * 1000)
}

async function poll () {
  const headers = {}
  if (lastModified) headers['If-Modified-Since'] = lastModified

  const allNotifications = []
  let url = `${NOTIFICATIONS_URL}?all=false&per_page=100`

  while (url) {
    const result = await githubFetch(url, { headers })

    // Respect X-Poll-Interval
    const serverInterval = result.headers.get('x-poll-interval')
    if (serverInterval) {
      pollInterval = Math.max(config.pollInterval, parseInt(serverInterval, 10))
    }

    if (result.status === 304) {
      lastPoll = new Date().toISOString()
      return
    }

    if (!result.data) {
      throw new Error(`GitHub API error: ${result.status}`)
    }

    // Store Last-Modified from first page only
    const lm = result.headers.get('last-modified')
    if (lm && allNotifications.length === 0) lastModified = lm

    allNotifications.push(...result.data)

    const links = parseLinkHeader(result.headers.get('link'))
    url = links.next || null
  }

  if (allNotifications.length > 0) {
    console.log(`[poller] Fetched ${allNotifications.length} notifications`)
    mergeNotifications(allNotifications)
    await resolveSubjectStates(allNotifications, config)
  }

  lastPoll = new Date().toISOString()
}
