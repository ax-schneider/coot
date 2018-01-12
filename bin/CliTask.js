/* eslint-disable no-console */

const { dirname, basename } = require('path')
const { statSync } = require('fs')
const template = require('lodash.template')
const change = require('gulp-change')
const rename = require('gulp-simple-rename')
const conflict = require('gulp-conflict')
const { resolvePath, readConfig } = require('../lib/utils')
const FileTask = require('../lib/FileTask')


const DEFAULT_CONFIG_PATH = 'coot.config.json'
const DEFAULT_CONFIG = {
  files: ['**', '!coot.*'],
  handlers: ['coot.handler'],
  options: 'coot.options',
}


function templateHandler(files, options) {
  return files
    .pipe(change((contents) => template(contents)(options)))
    .pipe(rename((path) => template(path)(options)))
}

function conflictHandler(files, options) {
  return files.pipe(conflict(options.dest, {
    logger: () => {},
  }))
}


class CliTask extends FileTask {
  static loadConfig(path) {
    let isDir
    path = resolvePath(path)

    try {
      isDir = statSync(path).isDirectory()
    } catch (err) {
      throw new Error(
        `Cannot load task config at ${path}: the path doesn't exist`
      )
    }

    let config, configDir

    if (isDir) {
      let configPath = resolvePath(path, DEFAULT_CONFIG_PATH)

      try {
        config = readConfig(configPath)
        configDir = dirname(configPath)
      } catch (err) {
        config = { name: basename(path) }
        configDir = path
      }
    } else {
      config = readConfig(path)
      configDir = dirname(path)
    }

    if (config.path) {
      config.path = resolvePath(configDir, config.path)
    } else {
      config.path = configDir
    }

    return config
  }

  static normalizeConfig(config) {
    config = Object.assign({}, DEFAULT_CONFIG, config)
    let { name, path, handlers, options } = config

    if (!path) {
      throw new Error('The path property is required')
    }

    path = resolvePath(path)

    try {
      if (!statSync(path).isDirectory()) {
        throw new Error()
      }
    } catch (err) {
      throw new Error(
        `Task path ${path} either doesn't exist or is not a directory`
      )
    }

    if (!name) {
      config.name = basename(path)
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

    config = super.normalizeConfig(config)
    config.path = path
    config.options.src.defaultValue = path

    return config
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

  constructor(config, cliConfig) {
    super(config)
    this.cliConfig = cliConfig
  }

  _makeHandlerArgs(command, result) {
    if (Array.isArray(result)) {
      return result.slice()
    }

    let args = super._makeHandlerArgs(command, result)
    args.push(this.cliConfig)
    return args
  }
}

CliTask.endHandlers = FileTask.endHandlers.concat(
  conflictHandler, templateHandler
)


module.exports = CliTask
