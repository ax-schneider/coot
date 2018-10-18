const camelcase = require('camelcase')
const OptionNormalizer = require('../OptionNormalizer')


function normalizeConfigOptions(options = []) {
  if (!Array.isArray(options)) {
    throw new Error('Task config options must be an array')
  }

  return options.map((option) => {
    let { type, defaultValue } = option
    option = Object.assign({}, option)

    if (!type && defaultValue !== undefined && defaultValue !== null) {
      option.type = typeof defaultValue
    }

    if (!option.finalName) {
      option.finalName = camelcase(option.name)
    }

    return option
  })
}

function normalizeConfig(config) {
  if (!config || typeof config !== 'object') {
    throw new Error('Task config must be an object')
  }

  if (!config.name) {
    throw new Error('Task config must have a name property')
  }

  config = Object.assign({}, config)
  config.options = normalizeConfigOptions(config.options)
  return config
}


class Task {
  static create(...args) {
    let task = new this(...args)
    return task.init().then(() => task)
  }

  // The constructor should never be called directly,
  // use the static create() instead
  constructor(config) {
    this.config = config
  }

  _prepareConfig() {
    return new Promise((resolve) => {
      this.config = normalizeConfig(this.config)
      resolve()
    })
  }

  // After initialization is completed, the task should be ready to run
  init() {
    return this._prepareConfig()
      .then(() => {
        this.optionNormalizer = new OptionNormalizer(this.config.options)
      })
  }

  _prepareOptions(options) {
    return this.optionNormalizer.normalize(options)
  }

  _handle() {
    throw new Error('Not implemented')
  }

  run(rawOptions, ...args) {
    return new Promise((resolve) => {
      let options = this._prepareOptions(rawOptions || {})
      let result = this._handle(options || {}, ...args)
      return resolve(result)
    })
  }
}


module.exports = Task
