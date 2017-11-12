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

    let config

    if (isDir) {
      let configPath = resolvePath(path, DEFAULT_CONFIG_PATH)

      try {
        config = readConfig(configPath)
        config.config = configPath
      } catch (err) {
        config = { name: basename(path) }
        config.path = path
      }
    } else {
      config = readConfig(path)
      config.config = path
    }

    return config
  }

  static resolveConfig(config) {
    config = Object.assign({}, DEFAULT_CONFIG, config)

    let { name, path, handlers, options } = config

    if (config.config) {
      config.config = resolvePath(config.config)
      let configDir = dirname(config.config)
      path = path ? resolvePath(configDir, path) : configDir
    } else if (path) {
      path = resolvePath(path)
    } else {
      throw new Error('Either "path" or "config" property is required')
    }

    try {
      if (!statSync(path).isDirectory()) {
        throw new Error()
      }
    } catch (err) {
      throw new Error(
        `Task path ${path} either doesn't exist or is not a directory`
      )
    }

    if (!name && path) {
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

    config = super.resolveConfig(config)
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

    this.command.lifecycle.hook({
      event: 'handle',
      tags: ['handleCommand'],
      goesAfter: ['handleCommand'],
    }, this._makeHandler(conflictHandler))

    this.command.lifecycle.hook({
      event: 'handle',
      tags: ['handleCommand'],
      goesAfter: ['handleCommand'],
    }, this._makeHandler(templateHandler))
  }

  _makeHandlerArgs(command, result) {
    if (Array.isArray(result)) {
      return result.slice()
    }

    let args = super._makeHandlerArgs(command, result)
    args.push(this.cliConfig)
    return args
  }

  execute(...args) {
    return super.execute(...args)
  }
}


module.exports = CliTask
