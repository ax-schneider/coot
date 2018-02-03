/* eslint-disable no-console, indent */

const Path = require('path')
const { spawn } = require('child_process')
const fs = require('fs-extra')
const envEditor = require('env-editor')
const comanche = require('comanche')
const { Help } = require('comanche/common')
const { handleResult } = require('appache-cli')
const {
  DEFAULT_COOT_CONFIG_PATH, loadConfig, installTask, getInstalledTasks,
  loadTask,
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

let task = app.command('task, t')
  .description('Create a task if it doesn\'t exist and open it in the editor')
  .version(false)
  .option('name')
    .description('Name of the task')
    .required()
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
    console.log(`Use "coot ${Path.basename(path)}" to run the task`)
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

task
  .handle(({ name }, { config }) => {
    let path = Path.join(config.tasksDir, name)
    let { editor } = config.options
    let editorObj = editor ? envEditor.get(editor) : envEditor.default()

    fs.ensureDirSync(path)

    let cp = spawn(editorObj.bin, [path], {
      shell: true,
      detached: true,
      stdio: editorObj.isTerminalEditor ? 'inherit' : 'ignore',
    })

    return new Promise((resolve, reject) => {
      cp.on('error', reject)

      if (editorObj.isTerminalEditor) {
        cp.on('exit', resolve)
      } else {
        cp.unref()
        resolve()
      }
    }).then(process.exit)
  })

run
  .tapAndHandle(function* (taskOptions, context, source) {
    console.log(`Running "${source}"...`)

    let { config, options } = context
    options = Object.assign({}, config.options, options, taskOptions)

    let task = yield loadTask(config, source)
    let result = yield task.run(options, config)

    handleResult(result, task.commandConfig)
    return context
  })
  .handle(() => {})


app.start()
