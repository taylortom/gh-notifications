import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

const cache = new Map()
const TERMINAL_STATES = new Set(['closed', 'merged', 'gone', 'inaccessible'])

let cacheFile = null
let saveTimer = null
const SAVE_DELAY = 5000

export function init (filePath) {
  cacheFile = filePath
  mkdirSync(dirname(cacheFile), { recursive: true })
  try {
    const data = JSON.parse(readFileSync(cacheFile, 'utf8'))
    for (const [url, entry] of Object.entries(data)) {
      cache.set(url, entry)
    }
    console.log(`[cache] Loaded ${cache.size} entries from disk`)
  } catch (err) {
    if (err.code !== 'ENOENT') console.warn(`[cache] Failed to load: ${err.message}`)
  }
}

export function get (url, openStateTtl) {
  const entry = cache.get(url)
  if (!entry) return null
  if (TERMINAL_STATES.has(entry.state)) return entry.state
  const age = (Date.now() - entry.cachedAt) / 1000
  if (age > openStateTtl) return null
  return entry.state
}

export function set (url, state) {
  cache.set(url, { state, cachedAt: Date.now() })
  scheduleSave()
}

export function size () {
  return cache.size
}

export function flush () {
  if (saveTimer) clearTimeout(saveTimer)
  saveToDisk()
}

function scheduleSave () {
  if (saveTimer) return
  saveTimer = setTimeout(() => {
    saveToDisk()
    saveTimer = null
  }, SAVE_DELAY)
}

function saveToDisk () {
  if (!cacheFile) return
  try {
    const data = Object.fromEntries(cache)
    writeFileSync(cacheFile, JSON.stringify(data))
  } catch (err) {
    console.warn(`[cache] Failed to save: ${err.message}`)
  }
}
