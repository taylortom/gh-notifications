import { createServer } from 'node:http'
import { route } from './router.js'

export function startServer (config) {
  const server = createServer((req, res) => {
    route(req, res)
  })
  server.listen(config.port, () => {
    console.log(`[server] Listening on port ${config.port}`)
  })
  return server
}
