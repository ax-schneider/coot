const Path = require('path')
const { resolvePath, readJson } = require('../utils/common')
const { COOT_DIR, GLOBAL_CONFIG_PATH } = require('../constants')


// Temporary solution for config composition


function readConfigFromFile(path) {
  return readJson(path).then((config) => {

    if (config.coot) {
      config = config.coot
    }

    return config
  })
}

function normalizeConfig(config, path) {
  return new Promise((resolve) => {
    let { templatesDir, options } = config
    let dir = Path.dirname(path)

    if (templatesDir) {
      config.templatesDir = resolvePath(dir, templatesDir)
    }

    if (typeof options === 'string') {
      let optionsPath = resolvePath(dir, options)
      let result = readJson(optionsPath).then((options) => {
        return Object.assign({}, config, { options })
      })

      return resolve(result)
    } else {
      return resolve(config)
    }
  })
}

function mergeConfigs(configs) {
  return configs.reduce((result, config) => {
    let options = Object.assign(result.options || {}, config.options)
    return Object.assign(result, config, { options })
  }, {})
}


module.exports = function loadConfig(path) {
  let configPromise = Promise.resolve({})
  let globalConfigPromise = readConfigFromFile(GLOBAL_CONFIG_PATH)
    .then((config = {}) => normalizeConfig(config, GLOBAL_CONFIG_PATH))

  if (!path) {
    return globalConfigPromise
  }

  path = resolvePath(path)

  if (path !== COOT_DIR) {
    let filePath = (Path.extname(path)) ? path : resolvePath(path, 'package.json')
    configPromise = readConfigFromFile(filePath)
      .then((config = {}) => normalizeConfig(config, filePath))
  }

  return Promise.all([globalConfigPromise, configPromise]).then(mergeConfigs)
}
