/* eslint-disable no-console */

const Path = require('path')
const comanche = require('comanche')
const { handleResult } = require('appache-cli')
const Task = require('../src/Task')
const { resolvePath, readConfig, mergeConfigs } = require('../src/utils')
const defaultConfig = require('../src/config')


const DEFAULT_PATH = resolvePath('~/.coot')
const USER_CONFIG_PATH = Path.join(DEFAULT_PATH, 'config.json')


let app = comanche('coot', ['-restrict'])

app
  .description('The cute task runner')
  .abstract()

app.option('-c')
  .description('Path to a config file relative to CWD')
  .type('path')

app.tap((options) => {
  let userConfig = readConfig(USER_CONFIG_PATH)
  let customConfig = (options.c) ? readConfig(options.c) : null
  let config = mergeConfigs(defaultConfig, userConfig, customConfig)

  if (!config.coot || !config.coot.tasks) {
    throw new Error('A path to coot tasks must be defined in "coot.tasks"')
  }

  config.coot.tasks = resolvePath(DEFAULT_PATH, config.coot.tasks)
  delete options.c

  return { config, options }
})

app.tapAndHandle('* **', function* (taskOptions, context, fullName) {
  let { config, options } = context
  let name = fullName[fullName.length - 1]

  config.task = config.task || {}
  config.task.name = name
  config.task.path = resolvePath(config.coot.tasks, name)
  options = mergeConfigs(options, taskOptions)

  let task = yield Task.load(config)
  let result = yield task.execute(options)
  handleResult(result)
})

app.start()
