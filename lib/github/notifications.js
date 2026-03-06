import { githubFetch } from './client.js'
import * as stateCache from './stateCache.js'

const STATELESS_TYPES = new Set(['Commit', 'CheckSuite'])

const notifications = new Map()

export async function resolveSubjectStates (items, config) {
  const needsResolution = items.filter(n => {
    if (STATELESS_TYPES.has(n.subject.type)) return false
    if (!n.subject.url) return false
    return stateCache.get(n.subject.url, config.openStateTtl) === null
  })

  for (let i = 0; i < needsResolution.length; i += config.concurrencyLimit) {
    const batch = needsResolution.slice(i, i + config.concurrencyLimit)
    await Promise.all(batch.map(n => resolveOne(n.subject.url)))
  }
}

async function resolveOne (url) {
  try {
    const { status, data } = await githubFetch(url)
    if (status === 404 || status === 410) {
      console.warn(`[notifications] Subject gone (${status}): ${url}`)
      stateCache.set(url, 'gone')
      return
    }
    if (status === 403) {
      console.warn(`[notifications] Subject inaccessible (403): ${url}`)
      stateCache.set(url, 'inaccessible')
      return
    }
    if (!data) {
      console.warn(`[notifications] Unexpected ${status} for ${url}`)
      stateCache.set(url, 'gone')
      return
    }
    const state = data.merged ? 'merged' : data.state || 'open'
    stateCache.set(url, state)
  } catch (err) {
    console.warn(`[notifications] Failed to resolve ${url}: ${err.message}`)
    stateCache.set(url, 'gone')
  }
}

export function mergeNotifications (items) {
  for (const item of items) {
    notifications.set(item.id, item)
  }
}

export function getFiltered (filters = {}) {
  return Array.from(notifications.values())
    .filter(n => {
      if (!STATELESS_TYPES.has(n.subject.type)) {
        if (!n.subject.url) return false
        const state = stateCache.get(n.subject.url, Infinity)
        if (state === 'gone' || state === 'inaccessible') return false
        if (!filters.includeClosed && (state === 'closed' || state === 'merged')) return false
      }
      if (filters.reason && n.reason !== filters.reason) return false
      if (filters.repo && n.repository.full_name !== filters.repo) return false
      if (filters.type && n.subject.type !== filters.type) return false
      return true
    })
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .map(n => ({
      id: n.id,
      reason: n.reason,
      unread: n.unread,
      updatedAt: n.updated_at,
      repository: n.repository.full_name,
      subject: {
        title: n.subject.title,
        type: n.subject.type,
        state: n.subject.url ? stateCache.get(n.subject.url, Infinity) || 'unknown' : null,
        htmlUrl: subjectHtmlUrl(n)
      }
    }))
}

export function removeNotification (id) {
  notifications.delete(id)
}

export function totalCount () {
  return notifications.size
}

function subjectHtmlUrl (n) {
  const repo = n.repository.html_url
  if (!repo) return null
  if (n.subject.type === 'PullRequest') {
    const num = n.subject.url?.split('/').pop()
    return num ? `${repo}/pull/${num}` : null
  }
  if (n.subject.type === 'Issue') {
    const num = n.subject.url?.split('/').pop()
    return num ? `${repo}/issues/${num}` : null
  }
  return null
}
