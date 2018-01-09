const comanche = require('comanche')
const { optionsToObject } = require('comanche/common')
const { next } = require('comanche/effects')


function resolveConfigOptions(options) {
  if (options && typeof options !== 'object') {
    throw new Error('Task config options must be an object')
  }

  let result = {}

  Object.keys(options || {}).forEach((name) => {
    let value = options[name]
    if (value && typeof value === 'object') {
      result[name] = value
    } else {
      let option = { defaultValue: value }
      result[name] = option

      if (typeof value !== 'undefined' && value !== null) {
        option.type = typeof value
      }
    }
  })

  return result
}


class Task {
  static resolveConfig(config) {
    if (!config || typeof config !== 'object') {
      throw new Error('Task config must be an object')
    }

    if (!config.name) {
      throw new Error('Task config must have a name property')
    }

    config = Object.assign({}, config)
    config.options = resolveConfigOptions(config.options)
    return config
  }

  constructor(config) {
    config = this.constructor.resolveConfig(config)
    let { name, description, options } = config

    this.config = config
    this.name = name

    this.command = comanche(name, ['-cli'])
      .description(description)
      .option('default')
      .default()
      .type(null)
      .hidden()
      .end()

    if (options) {
      Object.keys(options).forEach((optionName) => {
        let optionConfig = options[optionName]
        let option = this.command.option(optionName)

        Object.keys(options[optionName]).forEach((setting) => {
          if (typeof option[setting] !== 'function') {
            throw new Error(
              `Option "${optionName}" doesn't have a setting "${setting}"`
            )
          }
          option[setting](optionConfig[setting])
        })
      })
    }
  }

  _makeHandlerArgs(command, result) {
    if (Array.isArray(result)) {
      return result.slice()
    }

    let options = optionsToObject(command.options)
    return [options, this.config]
  }

  _makeHandler(fn) {
    let self = this
    return function* taskHandler(_, command, result) {
      let args = self._makeHandlerArgs(command, result)
      result = yield fn(...args)
      return yield next(_, command, result)
    }
  }

  handle(fn) {
    if (typeof fn !== 'function') {
      throw new Error('A handler must be a function')
    }

    let handler = this._makeHandler(fn)
    return this.command.lifecycle.hook({
      event: 'dispatch',
      tags: ['handleCommand'],
    }, handler)
  }

  _makeRequest(options) {
    if (options) {
      options = Object.keys(options).map((name) => {
        return { name, value: options[name] }
      })
    } else {
      options = []
    }

    return [{ name: this.name, options }]
  }

  execute(...args) {
    return new Promise((resolve) => {
      if (!this.hasStarted) {
        this.command.start()
        this.hasStarted = true
      }

      let request = this._makeRequest(...args)
      let result = this.command.execute(request)
      return resolve(result)
    })
  }
}


module.exports = Task
