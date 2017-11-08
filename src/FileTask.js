const { Stream, Transform } = require('stream')
const { dirname, basename, extname } = require('path')
const vfs = require('vinyl-fs')
const { resolvePath, readConfig } = require('./utils')
const Task = require('./Task')
const defaultConfig = require('./fileTaskConfig')


function loadFileTaskConfig(path) {
  let isPathToFile = Boolean(extname(path))

  if (isPathToFile) {
    path = resolvePath(path)
  } else {
    path = resolvePath(path, defaultConfig.config)
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

function resolveFileTaskConfig(config) {
  config = Object.assign({}, defaultConfig, config)
  let { path, handlers, options } = config

  if (!path) {
    throw new Error('The "path" property is required')
  }

  if (config.config) {
    config.config = resolvePath(path, config.config)
  }

  if (handlers) {
    config.handlers = []
    handlers.forEach((handlerPath) => {
      /* eslint-disable global-require */
      handlerPath = resolvePath(path, handlerPath)

      try {
        let handler = require(handlerPath)
        config.handlers.push(handler)
      } catch (err) {}
    })
  }

  if (typeof options === 'string') {
    let optionsPath = resolvePath(path, options)

    try {
      config.options = readConfig(optionsPath)
    } catch (err) {
      config.options = {}
    }
  }

  config.options.dest = {
    description: 'Destination path',
    type: 'path',
    defaultValue: '.',
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
      config = loadFileTaskConfig(path)
    } catch (err) {
      throw new Error(`Unable to load task at ${path}`)
    }

    return new this(config)
  }

  constructor(config) {
    config = resolveFileTaskConfig(config)

    super(config)

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
