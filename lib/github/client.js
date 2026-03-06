let rateLimitRemaining = null
let rateLimitReset = null
let githubToken = null

export function init (token) {
  githubToken = token
}

export async function githubFetch (url, options = {}) {
  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${githubToken}`,
    'X-GitHub-Api-Version': '2022-11-28',
    ...options.headers
  }
  const response = await fetch(url, { ...options, headers })

  const remaining = response.headers.get('x-ratelimit-remaining')
  if (remaining != null) rateLimitRemaining = parseInt(remaining, 10)
  const reset = response.headers.get('x-ratelimit-reset')
  if (reset != null) rateLimitReset = parseInt(reset, 10)

  if (response.status === 304) {
    return { status: 304, data: null, headers: response.headers }
  }
  if (response.status === 403 && rateLimitRemaining === 0) {
    const resetDate = new Date(rateLimitReset * 1000)
    throw new Error(`Rate limited until ${resetDate.toISOString()}`)
  }
  if (!response.ok) {
    return { status: response.status, data: null, headers: response.headers }
  }
  const text = await response.text()
  const data = text ? JSON.parse(text) : null
  return { status: response.status, data, headers: response.headers }
}

export function getRateLimitRemaining () {
  return rateLimitRemaining
}

/**
 * Parse Link header for pagination.
 * Returns an object like { next: 'url', last: 'url' }
 */
export function parseLinkHeader (header) {
  if (!header) return {}
  const links = {}
  for (const part of header.split(',')) {
    const match = part.match(/<([^>]+)>;\s*rel="([^"]+)"/)
    if (match) links[match[2]] = match[1]
  }
  return links
}
