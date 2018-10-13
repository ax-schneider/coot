const { resolvePath } = require('../utils/common')
const loadConfig = require('./loadConfig')


class ConfigManager {
  static load(path) {
    return new Promise((resolve) => {
      let configManager = new this(path)
      resolve(configManager.init())
    })
  }

  constructor(path) {
    this.path = resolvePath(path)
  }

  init() {
    return loadConfig()
      .then((config) => {
        this.config = config
        return this
      })
  }

  getCompiled() {
    return this.config
  }
}


module.exports = ConfigManager
