/* eslint-disable no-console */

const comanche = require('comanche')
const { InputError } = require('comanche/common')
const { handleResult } = require('appache-cli')
const { resolvePath } = require('../lib/utils')
const { loadUserConfig, resolveUserConfig } = require('./utils')
const TaskManager = require('./CliTaskManager')
const defaultConfig = require('./config.json')


const USER_PATH = resolvePath('~/.coot')


let app = comanche('coot', ['-restrict'])
  .description('The cute task runner')
  .abstract()

app.command('install, i', 'Save a task to the tasks dir')

app.tap((options) => {
  let userConfig = loadUserConfig(USER_PATH)
  let config = Object.assign(defaultConfig, userConfig)
  config = resolveUserConfig(config)
  let manager = new TaskManager(config.tasks)
  return { manager, config, options }
})


app
  .handle('install', () => {
    throw new InputError('Please specify a task to install')
  })
  .tap('install', (options, context) => {
    context.mode = 'install'
    return context
  })

app.tapAndHandle('* **', function* (taskOptions, context, fullName) {
  let { mode, manager, config, options } = context
  let id = fullName[fullName.length - 1]
  options = Object.assign({}, config.options, options, taskOptions)

  // '* **' matches all commands, but install and alias are handled separately
  if (fullName.length === 2 && ['install'].includes(id)) {
    return context
  }

  if (mode === 'install') {
    console.log(`Installing task "${id}"...`)
    yield manager.installTask(id)
  } else if (mode === 'alias') {
    // TODO: alias
  } else {
    console.log(`Executing task "${id}"...`)
    let task = yield manager.loadTask(id)
    task.cliConfig = config
    let result = yield task.execute(options)
    handleResult(result)
  }

  return context
})

app.handle('* **', () => {})

app.start()
