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

  let name = fullName[fullName.length - 1]
  let task = yield manager.loadTask(name)
  task.cliConfig = config

  let result = yield task.execute(options)
  handleResult(result)

  return context
})

app.handle('* **', () => {})

app.start()
