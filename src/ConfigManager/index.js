const Path = require('path')
const fs = require('fs-extra')
const { resolvePath, readJson } = require('../utils/common')
const { GLOBAL_CONFIG_PATH } = require('../constants')


const DEFAULT_CONFIG_FILE = 'package.json'
const BASE_CONFIG = {
  templatesDir: './cootTemplates',
  options: {},
}


function normalizeConfig(config, path) {
  return new Promise((resolve) => {
    config = Object.assign({}, BASE_CONFIG, config)
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


class ConfigManager {
  static load(path) {
    return new Promise((resolve) => {
      let configManager = new this(path)
      resolve(configManager.init())
    })
  }

  constructor(path) {
    this.rawPath = path
  }

  _loadConfig() {
    return new Promise((resolve, reject) => {
      let path = resolvePath(this.rawPath)
      fs.lstat(path, (err, stats) => {
        if (err) {
          return reject(err)
        }

        if (stats.isDirectory()) {
          // If path is a dir, try loading the "coot" property of package.json,
          // and if it isn't available, use the global config
          path = resolvePath(path, DEFAULT_CONFIG_FILE)
          let result = readJson(path)
            .then(
              (config) => {
                if (config.coot) {
                  return config.coot
                } else {
                  path = GLOBAL_CONFIG_PATH
                  return readJson(path)
                }
              },
              () => {
                path = GLOBAL_CONFIG_PATH
                return readJson(path)
              }
            )
            .then((config) => ({ config, path }))
          resolve(result)
        } else {
          let result = readJson(path).then((config) => ({ config, path }))
          resolve(result)
        }
      })
    }).then(({ config, path }) => {
      return normalizeConfig(config, path).then((config) => ({ config, path }))
    })
  }

  init() {
    return this._loadConfig()
      .then(({ config, path }) => {
        this.config = config
        this.path = path
        return this
      })
  }

  getCompiled() {
    return this.config
  }
}


module.exports = ConfigManager
