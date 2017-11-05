const { dirname, extname } = require('path')
const { resolvePath, readConfig } = require('../src/utils')


const USER_CONFIG_FILE = 'config.json'


function loadUserConfig(path) {
  let isPathToFile = Boolean(extname(path))

  if (isPathToFile) {
    path = resolvePath(path)
  } else {
    path = resolvePath(path, USER_CONFIG_FILE)
  }

  let configDir = dirname(path)
  let config = readConfig(path)
  config.config = path
  config.path = configDir

  return config
}

function resolveUserConfig(config) {
  let { path, tasks, options } = config

  if (!path) {
    throw new Error('The "path" property is required')
  }

  if (!tasks) {
    throw new Error('The "tasks" property is required')
  }

  config = Object.assign({}, config)
  config.tasks = resolvePath(path, tasks)

  if (typeof options === 'string') {
    let optionsPath = resolvePath(path, options)
    try {
      config.options = readConfig(optionsPath)
    } catch (err) {
      config.options = {}
    }
  }

  return config
}


module.exports = { loadUserConfig, resolveUserConfig }
