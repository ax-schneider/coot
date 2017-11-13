/* eslint-disable no-console */

const comanche = require('comanche')
const { handleResult } = require('appache-cli')
const { resolvePath } = require('../lib/utils')
const { loadUserConfig, resolveUserConfig } = require('./utils')
const TaskManager = require('./CliTaskManager')
const defaultConfig = require('./config.json')


const USER_PATH = resolvePath('~/.coot')


let app = comanche('coot', ['-restrict'])
  .description('The cute task runner')
  .abstract()

app.option('install, i')
  .description('Save the task to the tasks dir before running it')
  .type('boolean')
  .shared()

app.tap((options) => {
  let userConfig = loadUserConfig(USER_PATH)
  let config = Object.assign(defaultConfig, userConfig)
  config = resolveUserConfig(config)
  let manager = new TaskManager(config.tasks)
  return { manager, config, options }
})

app.tapAndHandle('* **', function* (taskOptions, context, fullName) {
  let { manager, config, options } = context
  options = Object.assign({}, config.options, options, taskOptions)

  let id = fullName[fullName.length - 1]

  // Ideally, the task option install/i would be the same as the global one,
  // but option sharing in appache doesn't work for unknown commands,
  // hence this check (would be just `if (options.install)` if it worked):
  if (typeof options.install !== 'undefined' ||
      typeof options.i !== 'undefined') {
    id = yield manager.installTask(id)
  }

  let task = yield manager.loadTask(id)
  task.cliConfig = config

  let result = yield task.execute(options)
  handleResult(result)

  return context
})

app.handle('* **', () => {})

app.start()
