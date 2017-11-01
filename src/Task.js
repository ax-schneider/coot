const comanche = require('comanche')
const { optionsToObject } = require('comanche/common')
const { next } = require('comanche/effects')
const { resolvePath, readConfig, mergeConfigs } = require('./utils')
const defaultConfig = require('./config')


function makeHandler(fn, baseConfig) {
  return function* taskHandler(commandConfig, command, config) {
    let { options } = command

    if (!config || typeof config !== 'object') {
      options = optionsToObject(options)
      config = mergeConfigs(baseConfig, options)
    }

    let result = yield fn(config)

    if (result === false) {
      return result
    }

    return yield next(commandConfig, command, result)
  }
}


class Task {
  static load(config) {
    config = mergeConfigs(config, defaultConfig)

    if (!config.task || !config.task.config) {
      throw new Error('Task config file must be defined in "task.config"')
    }

    let taskConfigPath = resolvePath(config.task.path, config.task.config)
    let taskConfig

    try {
      taskConfig = readConfig(taskConfigPath)
    } catch (err) {}

    if (taskConfig) {
      config = mergeConfigs(config, taskConfig)
    }

    let task = new Task(config)

    // TODO: load task handlers and hook them

    return task
  }

  constructor(config) {
    if (!config || typeof config !== 'object') {
      throw new Error('Task config must be an object')
    }

    if (!config.task || !config.task.name) {
      throw new Error('Task config must have a "task" object with a "name" property')
    }

    this.config = config
    this.name = config.task.name

    let command = comanche(config.task.name, ['-cli', '-restrict'])
    command.description(config.task.description)
    this._command = command

    // TODO: hookEnd the default handler for copying files
  }

  handle(fn) {
    if (typeof fn !== 'function') {
      throw new Error('A handler must be a function')
    }

    let handler = makeHandler(fn, this.config)
    return this._command.lifecycle.hook('handle', handler)
  }

  execute(options) {
    if (!this._started) {
      this._command.start()
      this._started = true
    }

    if (options) {
      options = Object.entries(options).map(([name, value]) => {
        return { name, value }
      })
    }

    return this._command.execute(null, options)
  }
}


module.exports = Task
