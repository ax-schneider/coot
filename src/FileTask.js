const { Stream, Transform } = require('stream')
const { dirname, basename, extname } = require('path')
const vfs = require('vinyl-fs')
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
  let config

  try {
    config = readConfig(path)
    config.config = path
  } catch (err) {
    config = {}
  }

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

function destHandler(files, options) {
  return new Promise((resolve, reject) => {
    files.pipe(vfs.dest(options.dest))
      .on('end', resolve)
      .on('error', reject)
  })
}


class FileTask extends Task {
  static load(path) {
    let config

    try {
      config = loadTaskConfig(path)
    } catch (err) {
      throw new Error(`Unable to load task at ${path}`)
    }

    return new this(config)
  }

  constructor(config) {
    config = resolveTaskConfig(config)

    super(config)

    this.command.option('dest, d')
      .description('Destination path')
      .type('path')
      .defaultValue('.')

    this.command.lifecycle.hook({
      event: 'handle',
      goesAfter: ['handleCommand'],
    }, this._makeHandler(destHandler))
  }

  _makeHandlerArgs(command, result) {
    if (Array.isArray(result)) {
      return result.slice()
    }

    let files = (result instanceof Stream) ? result : command.files
    let args = super._makeHandlerArgs(command)
    args.unshift(files)
    return args
  }

  _makeRequest(options) {
    let request = super._makeRequest(options)
    let { path, files } = this.config
    let fileStream = files ? vfs.src(files, { cwd: path }) : new Transform()
    request[0].files = fileStream
    return request
  }
}


module.exports = FileTask
