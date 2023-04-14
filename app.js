import express from 'express'
import cors from 'cors'
import asyncHandler from 'express-async-handler'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import Replicate from 'replicate'
import * as dotenv from 'dotenv'
dotenv.config()

const modelsAndVersions = {}

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

app.use(cors({ origin: 'https://chat.openai.com' }))
app.use(express.json())

app.post('/run', asyncHandler(async (req, res, next) => {
  const { models } = req.body

  if (!models) {
    res.status(400).json({ error: 'Missing required parameters: models' })
    return
  }

  // if models is not an array
  if (!Array.isArray(models)) {
    res.status(400).json({ error: 'models must be an array' })
    return
  }

  // if models is an empty array
  if (models.length === 0) {
    res.status(400).json({ error: 'models must be a non-empty array' })
    return
  }

  // loop through models and check for required parameters
  const missing = []
  for (const m of models) {
    const { username, model, input } = m
    if (!username || !model || !input) {
      const missingForModel = []
      if (!username) missingForModel.push('username')
      if (!model) missingForModel.push('model')
      if (!input) missingForModel.push('input')
      missing.push(`{ username: ${username}, model: ${model}, missing: ${missingForModel.join(',')} }`)
    }
  }

  if (missing.length > 0) {
    res.status(400).json({ error: `Missing required parameters: ${missing.join(',')}` })
    return
  }

  res.locals.models = models
  next()
}))

app.post('/run', asyncHandler(async (req, res) => {
  const { models } = req.body

  try {
    const modelOutputs = await Promise.all(models.map(async ({ username, model, input }) => {
      try {
        const modelId = `${username}/${model}:${modelsAndVersions[username][model]}`
        const output = await replicate.run(modelId, { input })
        return { output, error: null }
      } catch (e) {
        return { output: null, error: e.message }
      }
    }))

    res.status(200).json(modelOutputs)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}))

app.post('/model', asyncHandler(async (req, res) => {
  const { username, model } = req.body
  const response = await replicate.models.get(username, model)
  const output = {
    url: response.url,
    description: response.description,
    schema: response.latest_version.openapi_schema
  }

  modelsAndVersions[username] = modelsAndVersions[username] || {}
  modelsAndVersions[username][model] = response.latest_version.id
  res.status(200).json(output)
}))

app.post('/collections', asyncHandler(async (req, res) => {
  res.status(200).json([
    {
      slug: 'image-to-text',
      description: 'Models that generate images from text prompts'
    },
    {
      slug: 'audio-generation',
      description: 'Models to generate and modify audio'
    },
    {
      slug: 'diffusion-models',
      description: 'Image and video generation models trained with diffusion processes'
    },
    {
      slug: 'image-restoration',
      description: 'Models that improve or restore images by deblurring, colorization, and removing noise'
    },
    {
      slug: 'ml-makeovers',
      description: 'Models that let you change facial features'
    },
    {
      slug: 'super-resolution',
      description: 'Upscaling models that create high-quality images from low-quality images'
    },
    {
      slug: 'text-to-video',
      description: 'Models that create and edit videos'
    },
    {
      slug: 'style-transfer',
      description: 'Models that transfer the style of one image to another'
    },
  ])
}))

app.post('/collection', asyncHandler(async (req, res) => {
  const { collection_slug } = req.body
  const response = await replicate.collections.get(collection_slug)
  const models = response.models.map((model) => {
    modelsAndVersions[model.owner][model.name] = model.latest_version.id
    return {
      url: model.url,
      username: model.owner,
      model: model.name,
      description: model.description
    }
  })

  res.status(200).json(models)
}))

app.get('/logo.png', asyncHandler(async (req, res) => {
  const filename = path.join(__dirname, 'logo.png')
  res.sendFile(filename, { headers: { 'Content-Type': 'image/png' } })
}))

app.get('/.well-known/ai-plugin.json', asyncHandler(async (req, res) => {
  const filename = path.join(__dirname, '.well-known', 'ai-plugin.json')
  res.sendFile(filename, { headers: { 'Content-Type': 'application/json' } })
}))

app.get('/openapi.yaml', asyncHandler(async (req, res) => {
  const filename = path.join(__dirname, 'openapi.yaml')
  res.sendFile(filename, { headers: { 'Content-Type': 'text/yaml' } })
}))

const main = () => {
  app.listen(5003, '0.0.0.0', () => {
    console.log('Server running on http://0.0.0.0:5003')
  })
}

main()
