const { existsSync } = require('fs')
const { Transform } = require('stream')
const { dirname, basename, extname } = require('path')
const vfs = require('vinyl-fs')
const { resolvePath, readConfig } = require('./utils')
const Task = require('./Task')
const defaultConfig = require('./fileTaskConfig')


function srcHandler(_, options) {
  let { src, files } = options

  if (files && files.length) {
    return vfs.src(files, { cwd: src })
  } else {
    return new Transform()
  }
}

function destHandler(files, options) {
  return new Promise((resolve, reject) => {
    files.pipe(vfs.dest(options.dest))
      .on('end', resolve)
      .on('error', reject)
  })
}


class FileTask extends Task {
  static loadConfig(path) {
    path = resolvePath(path)

    if (!existsSync(path)) {
      throw new Error(
        `Cannot load task config at ${path}: the path does not exist`
      )
    }

    let isPathToFile = Boolean(extname(path))
    let configDir = dirname(path)
    let config

    if (!isPathToFile) {
      path = resolvePath(path, defaultConfig.config)
    }

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

    return config
  }

  static resolveConfig(config) {
    config = Object.assign({}, defaultConfig, config)
    let { path, handlers, files, options } = config

    if (!path) {
      throw new Error('The "path" property is required')
    }

    if (!existsSync(path)) {
      throw new Error(`Task path "${path}" does not exist`)
    }

    if (!config.name) {
      config.name = basename(path)
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

    if (files && !Array.isArray(files)) {
      files = [files]
    } else if (!files) {
      files = []
    }

    config.options.src = {
      description: 'Source path',
      type: 'path',
      defaultValue: config.path,
    }

    config.options.dest = {
      description: 'Destination path',
      type: 'path',
      defaultValue: '.',
    }

    config.options.files = {
      description: 'Files to process',
      defaultValue: null,
      coerce: (value) => {
        return value ? files.concat(value) : files
      },
    }

    return super.resolveConfig(config)
  }

  static load(path) {
    let config

    try {
      config = this.loadConfig(path)
    } catch (err) {
      throw new Error(`Unable to load task at ${path}`)
    }

    return new this(config)
  }

  constructor(config) {
    super(config)

    this.command.lifecycle.hook({
      event: 'handle',
      tags: ['handleCommand'],
      goesBefore: ['handleCommand'],
    }, this._makeHandler(srcHandler))

    this.command.lifecycle.hook({
      event: 'handle',
      tags: ['handleCommand'],
      goesAfter: ['handleCommand'],
    }, this._makeHandler(destHandler))
  }

  _makeHandlerArgs(command, result) {
    if (Array.isArray(result)) {
      return result.slice()
    }

    let args = super._makeHandlerArgs(command)
    args.unshift(result)
    return args
  }
}


module.exports = FileTask
