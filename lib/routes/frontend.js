import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const indexHtml = readFileSync(join(root, 'public', 'index.html'))
const faviconPng = readFileSync(join(root, 'public', 'favicon.png'))

export function handleFrontend (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(indexHtml)
}

export function handleFavicon (req, res) {
  res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' })
  res.end(faviconPng)
}
