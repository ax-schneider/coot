const Path = require('path')
const Os = require('os')


const COOT_PATH = Path.join(Os.homedir(), '.coot')
const TASKS_DIR = 'tasks'
const CONFIG_FILE = 'config.json'

module.exports = {
  COOT_PATH, TASKS_DIR, CONFIG_FILE,
}
