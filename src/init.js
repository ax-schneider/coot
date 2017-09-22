const { mkdirSync, writeFileSync } = require('fs')
const Path = require('path')
const { TASKS_DIR, CONFIG_FILE } = require('./constants')


function mkdir(dir) {
  try {
    mkdirSync(dir)
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err
    }
  }
}

module.exports = function init(dir, config) {
  mkdir(dir)
  mkdir(Path.join(dir, TASKS_DIR))

  let configString = JSON.stringify(config, null, 2)
  writeFileSync(Path.join(dir, CONFIG_FILE), configString)
}
