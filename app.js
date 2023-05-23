import express from 'express'
import cors from 'cors'
import asyncHandler from 'express-async-handler'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import Replicate from 'replicate'
import * as dotenv from 'dotenv'
dotenv.config()

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

app.use(cors({ origin: 'https://chat.openai.com' }))
app.use(express.json())

app.post('/run', asyncHandler(async (req, res) => {
  console.log('run', req.body)
  const { username, model, version, inputJSON } = req.body

  if (!username || !model || !version || !inputJSON) {
    const missing = []
    if (!username) missing.push('username')
    if (!model) missing.push('model')
    if (!version) missing.push('version')
    if (!inputJSON) missing.push('inputJSON')
    res.status(400).json({ error: `Missing required parameters: ${missing.join(',')}` })
    return
  }

  try {
    let input = JSON.parse(inputJSON)
    console.log(input)
    // chatgpt sometimes make the wraps the input as { input: { prompt: "foo" }}
    // we need to unwrap if so, so it doesn't end up double escaped in the run below
    if (typeof input === 'object' && input.hasOwnProperty('input')) {
      input = input['input']
    }
    const output = await replicate.run(`${username}/${model}:${version}`, { input })
    res.status(200).json(output)
  } catch (e) {
    console.log(e)
    res.status(500).json({ error: e.message })
  }
}))

app.post('/model', asyncHandler(async (req, res) => {
  console.log('model', req.body)
  const { username, model } = req.body
  const response = await replicate.models.get(username, model)
  const output = {
    url: response.url,
    version: response.latest_version.id,
    description: response.description,
    schema: response.latest_version.openapi_schema
  }
  res.status(200).json(output)
}))

app.post('/collections', asyncHandler(async (req, res) => {
  console.log('collections')
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
  console.log('collection', req.body)
  const { collection_slug } = req.body
  const response = await replicate.collections.get(collection_slug)
  const models = response.models.map((model) => {
    return {
      url: model.url,
      username: model.owner,
      model: model.name,
      version: model.latest_version.id,
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
  const schema = {
    schema_version: "v1",
    name_for_human: "Replicate models",
    name_for_model: "replicate_models",
    description_for_human: "Plugin to run Replicate models",
    description_for_model: "Plugin to run Replicate models",
    auth: {
      type: "none"
    },
    api: {
      type: "openapi",
      url: `${process.env.APP_HOST}/openapi.yaml`,
      is_user_authenticated: false
    },
    logo_url: `${process.env.APP_HOST}/logo.png`,
    contact_email: "team@replicate.com",
    legal_info_url: "http://replicate.com/terms"
  }

  res.status(200).json(schema)  
}))

app.get('/openapi.yaml', asyncHandler(async (req, res) => {
  const filename = path.join(__dirname, 'openapi.yaml')
  const schema = fs.readFileSync(filename, 'utf8').replace(/{APP_HOST}/g, process.env.APP_HOST)
  res.setHeader('Content-Type', 'text/yaml');
  res.status(200).send(schema)
}))

const main = () => {
  app.listen(5003, '0.0.0.0', () => {
    console.log('Server running on http://0.0.0.0:5003')
  })
}

main()
