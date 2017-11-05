const { dirname, basename, extname } = require('path')
const { resolvePath, readConfig } = require('./utils')
const Task = require('./Task')


const TASK_CONFIG_FILE = 'coot.config.json'


function loadTaskConfig(path) {
  let isPathToFile = Boolean(extname(path))

  if (isPathToFile) {
    path = resolvePath(path)
  } else {
    path = resolvePath(path, TASK_CONFIG_FILE)
  }

  let configDir = dirname(path)
  let config = readConfig(path)
  config.config = path

  if (config.path) {
    config.path = resolvePath(configDir, config.path)
  } else {
    config.path = configDir
  }

  if (!config.name) {
    config.name = basename(configDir)
  }

  return config
}

function resolveTaskConfig(config) {
  let { path, handlers, defaults } = config

  if (!path) {
    throw new Error('The "path" property is required')
  }

  config = Object.assign({}, config)

  if (config.config) {
    config.config = resolvePath(path, config.config)
  }

  if (handlers) {
    config.handlers = handlers.map((handlerPath) => {
      /* eslint-disable global-require */
      handlerPath = resolvePath(path, handlerPath)
      return require(handlerPath)
    })
  }

  if (typeof defaults === 'string') {
    let defaultsPath = resolvePath(path, defaults)
    config.defaults = readConfig(defaultsPath)
  }

  return config
}


class FileTask extends Task {
  static load(path) {
    let config

    try {
      config = loadTaskConfig(path)
    } catch (err) {
      throw new Error(`Unable to load task at ${path}`)
    }

    return new FileTask(config)
  }

  constructor(config) {
    config = resolveTaskConfig(config)

    super(config)

    this.command.option('dest, d')
      .description('Destination path')
      .type('path')
      .defaultValue('.')
  }
}


module.exports = FileTask
