const camelcase = require('camelcase')
const normalizeOptions = require('./normalizeOptions')


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
  }

  _prepareOptions(options = {}) {
    return new Promise((resolve) => {
      let result = normalizeOptions(this.config.options, options)
      resolve(result)
    })
  }

  _handle() {
    throw new Error('Not implemented')
  }

  run(rawOptions, ...args) {
    return new Promise((resolve, reject) => {
      this._prepareOptions(rawOptions || {}, ...args)
        .then((options) => this._handle(options || {}, ...args))
        .then(resolve, reject)
    })
  }
}


module.exports = Task
