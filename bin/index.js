/* eslint-disable no-console */

const Path = require('path')
const comanche = require('comanche')
const { handleResult } = require('appache-cli')
const Task = require('../src/Task')
const { readConfig, mergeConfigs, resolveObjectPaths } = require('../src/utils')
const defaultConfig = require('../src/config')


const DEFAULT_PATH = '~/.coot'
const USER_CONFIG_PATH = Path.join(DEFAULT_PATH, 'config.json')


let app = comanche('coot')

app
  .restrict(false)
  .description('The cute task runner')
  .abstract()

app.option('-c')
  .description('Path to a config file relative to CWD')
  .type('path')

app.tap((options) => {
  let { c: configPath } = options
  let customConfig = (configPath) ? readConfig(configPath) : null
  let config = mergeConfigs(defaultConfig, customConfig, options)
  let userConfigDir = Path.dirname(USER_CONFIG_PATH)
  return resolveObjectPaths(config, ['coot.tasks'], userConfigDir)
})

app.tapAndHandle('* **', function* (options, config, fullName) {
  let name = fullName[fullName.length - 1]
  let taskPath = yield Task.resolve(config.coot.tasks, name)
  let task = yield Task.load(taskPath, config, name)
  let result = yield task.execute(options)
  handleResult(result)
})

app.start()
