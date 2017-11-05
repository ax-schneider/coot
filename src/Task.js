const comanche = require('comanche')
const { optionsToObject } = require('comanche/common')
const { next } = require('comanche/effects')


function makeHandler(fn, taskConfig) {
  return function* taskHandler(_, command, context) {
    let { options, args, result } = context
    result = yield fn(options, taskConfig, ...args, result)
    return yield next(_, command, { options, args, result })
  }
}

function* prepareHandleContext(_, command) {
  let options = optionsToObject(command.options)
  let args = options.args
  delete options.args
  let context = yield next(_, command, { options, args })
  return context.result
}


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

    this.command.lifecycle.hook({
      event: 'handle',
      goesBefore: ['handleCommand'],
    }, prepareHandleContext)
  }

  handle(fn) {
    if (typeof fn !== 'function') {
      throw new Error('A handler must be a function')
    }

    let handler = makeHandler(fn, this.config)
    return this.command.lifecycle.hook({
      event: 'handle',
      tags: ['handleCommand'],
    }, handler)
  }

  execute(options, ...args) {
    if (!this.hasStarted) {
      this.command.start()
      this.hasStarted = true
    }

    if (options) {
      options = Object.entries(options).map(([name, value]) => {
        return { name, value }
      })
    } else {
      options = []
    }

    options.push({ name: 'args', value: args })
    return this.command.execute(null, options)
  }
}


module.exports = Task
