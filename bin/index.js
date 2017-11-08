/* eslint-disable no-console */

const comanche = require('comanche')
const { handleResult } = require('appache-cli')
const { resolvePath } = require('../lib/utils')
const { loadUserConfig, resolveUserConfig } = require('./utils')
const CliTask = require('./CliTask')
const defaultConfig = require('./config.json')


const USER_PATH = resolvePath('~/.coot')


let app = comanche('coot', ['-restrict'])
  .description('The cute task runner')
  .abstract()

app.tap((options) => {
  let userConfig = loadUserConfig(USER_PATH)
  let config = Object.assign(defaultConfig, userConfig)
  config = resolveUserConfig(config)
  return { config, options }
})

app.tapAndHandle('* **', function* (taskOptions, context, fullName) {
  let { config, options } = context
  let name = fullName[fullName.length - 1]
  let taskPath = resolvePath(config.tasks, name)
  options = Object.assign({}, config.options, options, taskOptions)

  let task = yield CliTask.load(taskPath)
  task.cliConfig = config

  let result = yield task.execute(options)
  handleResult(result)
})

app.start()
