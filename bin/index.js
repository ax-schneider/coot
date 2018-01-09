/* eslint-disable no-console, indent */

const comanche = require('comanche')
const { resolvePath } = require('../lib/utils')
const { loadUserConfig, resolveUserConfig } = require('./utils')
const TaskManager = require('./CliTaskManager')
const defaultConfig = require('./config.json')


const USER_PATH = resolvePath('~/.coot')


let app = comanche('coot')
  .description('The cute task runner')
  .abstract()
  .option('default')
    .default()
    .hidden()
    .type(null)

let install = app.command('install, i')
  .description('Save a task to the tasks dir')
  .version(false)
  .option('source, s')
    .description('A local path or a git URL of the task to be installed')
    .type('string')
    .required()
    .positional()
  .option('name, n')
    .description('A name to save the task with')
    .type('string')
    .positional()

let run = app.command('run')
  .description('Run a task')
  .default()
  .defaultCommand('coot.run')
  .version(false)
  .help(false)
  .hidden()
  .option('default')
    .default()
    .hidden()
    .type(null)


app
  .tap((options) => {
    let userConfig = loadUserConfig(USER_PATH)
    let config = Object.assign(defaultConfig, userConfig)
    config = resolveUserConfig(config)
    let manager = new TaskManager(config.tasks)
    return { manager, config, options }
  })

install
  .handle(({ source }, { manager }) => {
    console.log(`Installing task "${source}"...`)
    return manager.installTask(source)
  })

run
  .tapAndHandle(function* (taskOptions, context, id) {
    let { manager, config, options } = context
    options = Object.assign({}, config.options, options, taskOptions)

    console.log(`Running task "${id}"...`)
    let task = yield manager.loadTask(id)
    task.cliConfig = config
    yield task.execute(options)

    return context
  })
  .handle(() => {})


app.start()
