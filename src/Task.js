const comanche = require('comanche')
const { optionsToObject } = require('comanche/common')
const { next } = require('comanche/effects')


function makeHandler(fn, taskConfig) {
  return function* taskHandler(_, command, context) {
    let { params, args, result } = context
    result = yield fn(params, taskConfig, ...args, result)
    return yield next(_, command, { params, args, result })
  }
}

function* prepareHandleContext(_, command) {
  let params = optionsToObject(command.options)
  let args = params.args
  delete params.args
  let context = yield next(_, command, { params, args })
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

    if (config.defaultParams) {
      Object.entries(config.defaultParams).forEach(([key, value]) => {
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

  execute(params, ...args) {
    if (!this.hasStarted) {
      this.command.start()
      this.hasStarted = true
    }

    if (params) {
      params = Object.entries(params).map(([name, value]) => {
        return { name, value }
      })
    } else {
      params = []
    }

    params.push({ name: 'args', value: args })
    return this.command.execute(null, params)
  }
}


module.exports = Task
