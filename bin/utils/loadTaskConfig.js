const fs = require('fs')
const Path = require('path')
const readPackageJson = require('read-package-json')
const { resolvePath } = require('../../lib/utils')
const CliTask = require('../CliTask')
const { getOptionsFromTemplates } = require('./templates')


function resolveConfigPath(path) {
  path = resolvePath(path)

  if (!fs.existsSync(path)) {
    throw new Error(`Path ${path} doesn't exist`)
  }

  let isDir = !Path.extname(path)
  let basename = Path.basename(path)

  if (isDir) {
    path = Path.join(path, 'package.json')
  } else if (basename !== 'package.json') {
    throw new Error(
      'A task config path must be a directory or a package.json file, ' +
      `given: ${path}`
    )
  }

  return path
}

function readConfigFromPackageJson(path) {
  return new Promise((resolve, reject) => {
    let dir = Path.dirname(path)

    readPackageJson(path, (err, data) => {
      if (err && err.code !== 'ENOENT') {
        return reject(err)
      }

      let config = data ? Object.assign({}, data) : {}
      config.name = config.name || Path.basename(dir)
      config.dir = dir

      if (data) {
        config.path = path
      }

      return resolve(config)
    })
  })
}

// Mutates the config assuming that it comes from loadTaskConfig
// where it is cloned
function fillConfigWithTemplateOptions(config) {
  return new Promise((resolve) => {
    let { files } = config

    let result = getOptionsFromTemplates(config.dir, files)
      .then((optionNames) => {
        if (optionNames.length) {
          optionNames.forEach((name) => {
            if (!config.options[name]) {
              config.options[name] = {
                type: null,
                inquire: true,
              }
            }
          })
        }
        return config
      })
    return resolve(result)
  })
}

module.exports = function loadTaskConfig(path) {
  return new Promise((resolve) => {
    path = resolveConfigPath(path)

    let result = readConfigFromPackageJson(path)
      .then((rawConfig) => {
        let config = CliTask.normalizeConfig(rawConfig)
        let { files, templates } = config

        if (files && templates !== false && !rawConfig.options) {
          return fillConfigWithTemplateOptions(config)
        }

        return config
      })
    return resolve(result)
  })
}
