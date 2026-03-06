let allowedTokens = null

export function init (tokens) {
  allowedTokens = tokens
}

export function requireAuth (req, res) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.writeHead(401, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Missing or malformed Authorization header' }))
    return false
  }
  const token = header.slice(7)
  if (!allowedTokens.has(token)) {
    res.writeHead(403, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid token' }))
    return false
  }
  return true
}

export function checkToken (token) {
  return allowedTokens.has(token)
}
