const isValidArray = (body, name) => {
  const input = body[name]

  if (!input) {
    res.status(400).json({ error: `Missing required parameters: ${name}` })
    return false
  }

  // if models is not an array
  if (!Array.isArray(input) || input.length === 0) {
    res.status(400).json({ error: `${name} must be a non-empty array` })
    return false
  }

  return true
}

const normalize = (obj) => {
  for (const params of obj) {
    if (params.model.includes(':')) {
      params.model = params.model.split(':')[0]
    }

    if (params.model.includes('/')) {
      const splitModel = params.model.split('/')
      params.username = splitModel[0]
      params.model = splitModel[1]
    }

    if (params.inputs) {
      params.input = params.inputs
      delete params.inputs
    }

    // No input, but object is more than just username and model, assume the rest are inputs
    if (!params.input && Object.keys(m).length > 2) {
      params.input = {}
      for (const key in m) {
        if (key !== 'username' && key !== 'model') {
          params.input[key] = m[key]
        }
      }
    }
  }

  return obj
}

const isMissingParams = (items, requiredParams) => {
  const missing = []
  for (const item of items) {
    const missingForModel = []
    for (const param of requiredParams) {
      if (!item[param]) {
        missingForModel.push(param);
      }
    }

    if (missingForModel.length > 0) {
      const missingParamsStr = missingForModel.join(', ')
      const itemStr = JSON.stringify(item)
      missing.push(`{ item: ${itemStr}, missing: ${missingParamsStr} }`)
    }
  }

  if (missing.length > 0) {
    res.status(400).json({ error: `Missing required parameters: ${missing.join(',')}` })
  }

  return missing.length > 0
}

export {
  isValidArray,
  isMissingParams,
  normalize
}
