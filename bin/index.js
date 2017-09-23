/* eslint-disable global-require, no-console */

const Path = require('path')
const Os = require('os')
const appache = require('appache')
const { InputError } = require('appache/common')
const apiPlugin = require('appache-api-fluent')
const cliPlugin = require('appache-cli')
const { CONFIG_FILE } = require('../src/constants')
const { init, readConfig } = require('../src')


const DEFAULT_CONFIG = readConfig(Path.join(__dirname, '..', 'src', 'config.json'))
const COOT_PATH = Path.join(Os.homedir(), '.coot')


let plugins = [apiPlugin, cliPlugin, '-unknownCommands']
let app = appache(plugins)('coot')

app.option('--coot-path, -p', `Path to the coot dir (default: ${COOT_PATH})`)
  .type('path')
  .defaultValue(COOT_PATH)

app.option('--coot-init, -i', 'Initialize coot at coot-path')
  .type('boolean')

app.handle((options) => {
  let { cootInit, cootPath } = options

  if (cootInit) {
    process.stdout.write(`Initializing coot at ${cootPath}...`)
    init(cootPath, DEFAULT_CONFIG)
    console.log(' ✔️')
    return
  }

  throw new InputError('Please specify a task or use --coot-init')
})

app.tap((options) => {
  let { cootInit, cootPath } = options

  if (cootInit) {
    throw new InputError('--coot-init must be used without any tasks')
  }

  let configPath = Path.join(cootPath, CONFIG_FILE)
  return readConfig(configPath)
})

app.start()
