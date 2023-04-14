import asyncHandler from 'express-async-handler'
import {
  isMissingParams,
  isValidArray,
  normalize,
  isValidInputForSchema
} from '../helpers/input-validator.js'

const modelsAndVersions = {}

export default (app, replicate) => {
  app.post('/run', asyncHandler(async (req, res, next) => {
    if (!isValidArray(req.body, 'models')) return
    res.locals.models = normalize(req.body.models)
    if (isMissingParams(res.locals.models, ['username', 'model', 'input'])) return
    next()
  }))

  app.post('/run', asyncHandler(async (_req, res) => {
    try {
      const modelOutputs = await Promise.all(res.locals.models.map(async ({ username, model, input }) => {
        try {
          if (!modelsAndVersions[username] || !modelsAndVersions[username][model]) {
            const response = await replicate.models.get(username, model)
            modelsAndVersions[username] = modelsAndVersions[username] || {}
            modelsAndVersions[username][model] = { id: response.latest_version.id, schema: response.latest_version.openapi_schema }
          }

          const { isValid, err } = isValidInputForSchema(input, modelsAndVersions[username][model].schema)
          if (!isValid) {
            return { error: err, schema: modelsAndVersions[username][model].schema }
          }

          const modelId = `${username}/${model}:${modelsAndVersions[username][model].id}`
          const output = await replicate.run(modelId, { input })
          console.log(modelId, input, output)
          return { output }
        } catch (e) {
          return { error: e.message }
        }
      }))

      res.status(200).json(modelOutputs)
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }))

  app.post('/getModelSchemas', asyncHandler(async (req, res, next) => {
    if (!isValidArray(req.body, 'schemas')) return
    res.locals.schemas = normalize(req.body.schemas)
    if (isMissingParams(res.locals.schemas, ['username', 'model'])) return
    next()
  }))

  app.post('/getModelSchemas', asyncHandler(async (req, res) => {
    try {
      const outputs = await Promise.all(res.locals.schemas.map(async ({ username, model }) => {
        try {
          const response = await replicate.models.get(username, model)
          console.log(username, model, response)
          const output = {
            url: response.url,
            description: response.description,
            schema: response.latest_version.openapi_schema
          }

          modelsAndVersions[username] = modelsAndVersions[username] || {}
          modelsAndVersions[username][model] = { id: response.latest_version.id, schema: response.latest_version.openapi_schema }
          return { output }
        } catch (e) {
          return { error: e.message }
        }
      }))
      res.status(200).json(outputs)
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }))
}
