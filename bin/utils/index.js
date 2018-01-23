const Path = require('path')
const { tmpdir } = require('os')
const fs = require('fs-extra')
const downloadGitRepo = require('download-git-repo')
const { resolvePath, readConfig } = require('../../lib/utils')
const CliTask = require('../CliTask')
const DEFAULT_COOT_CONFIG = require('../config.json')
const loadTaskConfig = require('./loadTaskConfig')


const DEFAULT_COOT_DIR = resolvePath('~/.coot')
const DEFAULT_COOT_CONFIG_PATH = resolvePath(DEFAULT_COOT_DIR, 'config.json')
const TEMP_PATH = resolvePath(tmpdir(), 'coot')


function determineSourceType(source) {
  if (/^[a-zA-Z0-9_-]+$/.test(source)) {
    return 'name'
  } else if (/^([a-zA-Z]:|[a-zA-Z]:[/\\]|\/|\.|~).*/.test(source)) {
    return 'path'
  } else {
    return 'git'
  }
}

function normalizeGitUrl(url) {
  // download-git-repo doesn't understand simple github urls
  if (url.startsWith('https://github.com/')) {
    url = url.slice(19)
  }

  return url
}

function getNameFromGitUrl(url) {
  let regexp = /^((github|gitlab|bitbucket):)?((.+):)?([^/]+)\/([^#]+)(#(.+))?$/
  let matches = regexp.exec(normalizeGitUrl(url))
  return matches[6]
}

function downloadFromGit(src) {
  return new Promise((resolve, reject) => {
    let dest = Path.join(TEMP_PATH, getNameFromGitUrl(src))
    src = normalizeGitUrl(src)

    return downloadGitRepo(src, dest, (err) => {
      return err ? reject(err) : resolve(dest)
    })
  })
}

function normalizeConfig(config) {
  config = Object.assign(DEFAULT_COOT_CONFIG, config)
  let { path, tasksDir, options } = config

  if (!path) {
    throw new Error('The "path" property is required')
  }

  if (!tasksDir) {
    throw new Error('The "tasksDir" property is required')
  }

  let configDir = Path.dirname(path)

  config = Object.assign({}, config)
  config.tasksDir = resolvePath(configDir, tasksDir)

  if (typeof options === 'string') {
    config.options = resolvePath(configDir, options)
  }

  return config
}

function loadConfig(path = DEFAULT_COOT_CONFIG_PATH) {
  let extension = Path.extname(path)

  if (extension !== '.json') {
    throw new Error('The coot config must be a JSON file')
  }

  let config = readConfig(resolvePath(path))
  config.path = path
  config = normalizeConfig(config)

  if (typeof config.options === 'string') {
    config.options = readConfig(config.options)
  }

  return config
}

function resolveTaskAlias(config, alias) {
  let { aliases } = config

  if (aliases && aliases[alias]) {
    return resolveTaskAlias(aliases[alias])
  } else {
    return alias
  }
}

function resolveTaskSource(config, source) {
  return new Promise((resolve) => {
    source = resolveTaskAlias(config, source)

    let type = determineSourceType(source)

    if (type === 'git') {
      return resolve(downloadFromGit(source))
    } else if (type === 'name') {
      return resolve(resolvePath(config.tasksDir, source))
    } else {
      return resolve(source)
    }
  })
}

function normalizeTaskConfig(config) {
  return CliTask.normalizeConfig(config)
}

function loadTask(config, source) {
  return resolveTaskSource(config, source)
    .then(loadTaskConfig)
    .then(
      (config) => {
        return new CliTask(config)
      },
      (err) => {
        throw new Error(`Unable to load task ${source}: ${err.message}`)
      }
    )
}

function isTaskInstalled(config, name) {
  return new Promise((resolve) => {
    let path = resolvePath(config.tasksDir, name)
    return resolve(fs.pathExists(path))
  })
}

function getInstalledTasks(config) {
  return new Promise((resolve) => {
    let tasks = fs.readdirSync(config.tasksDir).filter((entry) => {
      let path = Path.join(config.tasksDir, entry)
      return fs.statSync(path).isDirectory()
    })
    return resolve(tasks)
  })
}

function installTask(config, source, name) {
  return loadTask(config, source)
    .then((task) => {
      let { path } = task.config
      name = name || task.name
      let newPath = resolvePath(config.tasksDir, name)

      if (path === newPath) {
        return newPath
      }

      return isTaskInstalled(config, name)
        .then((isInstalled) => {
          if (isInstalled) {
          // TODO: inquire for overwriting
            return fs.emptyDir(newPath)
          }
        })
        .then(() => fs.copy(path, newPath))
        .then(() => newPath)
    })
}

function runTask(config, source, options) {
  return loadTask(config, source)
    .then((task) => {
      options = Object.assign(config.options, options)
      return task.run(options, config)
    })
}


module.exports = {
  DEFAULT_COOT_CONFIG, DEFAULT_COOT_DIR, DEFAULT_COOT_CONFIG_PATH,
  normalizeConfig, loadConfig, resolveTaskAlias, resolveTaskSource,
  loadTask, isTaskInstalled, getInstalledTasks, loadTaskConfig,
  normalizeTaskConfig, installTask, runTask,
}
