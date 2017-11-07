const comanche = require('comanche')
const { optionsToObject } = require('comanche/common')
const { next } = require('comanche/effects')


class Task {
  constructor(config) {
    if (!config || typeof config !== 'object') {
      throw new Error('Task config must be an object')
    }

    if (!config.name) {
      throw new Error('Task config must have a name property')
    }

    this.config = config
    this.name = config.name

    let command = comanche(config.name, ['-cli', '-restrict'])
    command.description(config.description)
    this.command = command

    if (config.defaults) {
      Object.entries(config.defaults).forEach(([key, value]) => {
        let option = command.option(key)

        if (typeof value !== 'undefined') {
          option.defaultValue(value)
          option.type(typeof value)
        }
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
      event: 'handle',
      tags: ['handleCommand'],
    }, handler)
  }

  _makeRequest(options) {
    if (options) {
      options = Object.entries(options).map(([name, value]) => {
        return { name, value }
      })
    } else {
      options = []
    }

    return [{
      fullName: this.command.getFullName(),
      options,
    }]
  }

  execute(options) {
    return new Promise((resolve) => {
      if (!this.hasStarted) {
        this.command.start()
        this.hasStarted = true
      }

      let request = this._makeRequest(options)
      let result = this.command.execute(request)
      return resolve(result)
    })
  }
}


module.exports = Task
