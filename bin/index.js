/* eslint-disable no-console */

const Path = require('path')
const appache = require('appache')
const apiPlugin = require('appache-api-fluent')
const cliPlugin = require('appache-cli')
const Task = require('../src/Task')
const { readConfig, mergeConfigs, resolveObjectPaths } = require('../src/utils')
const defaultConfig = require('../src/config')


const DEFAULT_PATH = '~/.coot'
const USER_CONFIG_PATH = Path.join(DEFAULT_PATH, 'config.json')


let plugins = [apiPlugin, cliPlugin, '-unknownCommands']
let app = appache(plugins)('coot')

app
  .description('The cute task runner')
  .abstract()

app.option('-c', `Path to a config file to merge with the one at ${USER_CONFIG_PATH}`)
  .type('path')

app.tap((options) => {
  let { c: configPath } = options
  let customConfig = (configPath) ? readConfig(configPath) : null
  let config = mergeConfigs(defaultConfig, customConfig, options)
  let userConfigDir = Path.dirname(USER_CONFIG_PATH)
  return resolveObjectPaths(config, ['coot.tasks'], userConfigDir)
})

app.tapAndHandle('* **', (options, config, fullName) => {
  let name = fullName[fullName.length - 1]
  let taskPath = Task.resolve(config.coot.tasks, name)
  let task = Task.load(taskPath, config, name)
  task.execute(options)
})

app.start()
