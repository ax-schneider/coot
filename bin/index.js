/* eslint-disable no-console, indent */

const { basename } = require('path')
const comanche = require('comanche')
const { Help } = require('comanche/common')
const { handleResult } = require('appache-cli')
const {
  DEFAULT_COOT_CONFIG_PATH, loadConfig, installTask, getInstalledTasks, runTask,
} = require('./utils')


let app = comanche('coot')
  .description('The cute task runner')
  .option('config, c')
    .description('Path to the config file')
    .type('path')
    .defaultValue(DEFAULT_COOT_CONFIG_PATH)
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

// TODO: remove the command and instead show the list as part of help
let list = app.command('list, l')
  .description('List installed tasks')
  .version(false)

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
    let config = loadConfig(options.config)
    options = Object.assign({}, options)
    delete options.config
    return { config, options }
  })
  .handle(() => new Help())

install
  .handle(function* ({ source }, { config }) {
    console.log(`Installing "${source}"...`)
    let path = yield installTask(config, source)
    console.log(`Successfully installed at ${path}`)
    console.log(`Use "coot ${basename(path)}" to run the task`)
  })

list
  .handle(function* (options, { config }) {
    let tasks = yield getInstalledTasks(config)
    console.log()

    if (tasks.length) {
      console.log('Installed tasks:')
      tasks.forEach((task) => console.log(`  ${task}`))
    } else {
      console.log('There are no installed tasks')
    }

    console.log()
  })

run
  .tapAndHandle(function* (taskOptions, context, source) {
    let { config, options } = context
    options = Object.assign({}, options, taskOptions)

    console.log(`Running "${source}"...`)
    let result = yield runTask(config, source, options)

    if (result instanceof Help) {
      return result
    }

    handleResult(result.value, result.command)
    return context
  })
  .handle(() => {})


app.start()
