import asyncHandler from 'express-async-handler'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const parentDirname = path.join(__dirname, '..')

export default (app) => {
  app.get('/logo.png', asyncHandler(async (_req, res) => {
    const filename = path.join(parentDirname, 'logo.png')
    res.sendFile(filename, { headers: { 'Content-Type': 'image/png' } })
  }))

  app.get('/.well-known/ai-plugin.json', asyncHandler(async (_req, res) => {
    const filename = path.join(parentDirname, '.well-known', 'ai-plugin.json')
    res.sendFile(filename, { headers: { 'Content-Type': 'application/json' } })
  }))

  app.get('/openapi.yaml', asyncHandler(async (_req, res) => {
    const filename = path.join(parentDirname, 'openapi.yaml')
    res.sendFile(filename, { headers: { 'Content-Type': 'text/yaml' } })
  }))
}
