const { tmpdir } = require('os')
const Path = require('path')
const { pathExists, copy, emptyDir } = require('fs-extra')
const downloadGitRepo = require('download-git-repo')
const { resolvePath, readConfig } = require('../lib/utils')
const CliTask = require('./CliTask')
const defaultConfig = require('./config.json')


const USER_CONFIG_FILE = 'config.json'
const TEMP_PATH = resolvePath(tmpdir(), 'coot')


function determineSourceType(source) {
  if (source instanceof CliTask) {
    return 'task'
  } else if (source && typeof source === 'object') {
    return 'config'
  } else if (/^[a-zA-Z0-9_-]+$/.test(source)) {
    return 'name'
  } else if (/^([a-zA-Z]:|[a-zA-Z]:[/\\]|\/|\.|~).*/.test(source)) {
    return 'path'
  } else if (typeof source === 'string') {
    return 'git'
  }

  throw new Error(`Unable to determine the source type of "${source}"`)
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


class CliTaskManager {
  static loadConfig(path) {
    let extension = Path.extname(path)

    if (!extension) {
      path = resolvePath(path, USER_CONFIG_FILE)
    } else if (extension === '.json') {
      path = resolvePath(path)
    } else {
      throw new Error('The config must be a JSON file')
    }

    let configDir = Path.dirname(path)
    let config = readConfig(path)
    config.config = path
    config.path = configDir

    return config
  }

  static normalizeConfig(config) {
    config = Object.assign(defaultConfig, config)
    let { path, tasks, options } = config

    if (!path) {
      throw new Error('The "path" property is required')
    }

    if (!tasks) {
      throw new Error('The "tasks" property is required')
    }

    config = Object.assign({}, config)
    config.tasks = resolvePath(path, tasks)

    if (typeof options === 'string') {
      let optionsPath = resolvePath(path, options)
      try {
        config.options = readConfig(optionsPath)
      } catch (err) {
        config.options = {}
      }
    }

    return config
  }

  static load(path) {
    let config = this.loadConfig(path)
    return new CliTaskManager(config)
  }

  constructor(config) {
    this.config = this.constructor.normalizeConfig(config)
  }

  resolveAlias(alias) {
    let { aliases } = this.config

    if (aliases && aliases[alias]) {
      return this.resolveAlias(aliases[alias])
    } else {
      return alias
    }
  }

  resolveSource(source) {
    return new Promise((resolve) => {
      source = this.resolveAlias(source)

      let type = determineSourceType(source)
      let path, config

      if (type === 'config') {
        config = source
      } else if (type === 'task') {
        config = source.config
      } else if (type === 'git') {
        config = downloadFromGit(source)
          .then((path) => CliTask.loadConfig(path))
      } else if (type === 'name') {
        path = resolvePath(this.config.tasks, source)
        config = CliTask.loadConfig(path)
      }

      return resolve(config)
    })
  }

  loadTask(source) {
    return this.resolveSource(source)
      .then((taskConfig) => {
        return new CliTask(taskConfig, this.config)
      })
  }

  isTaskInstalled(name) {
    let path = resolvePath(this.config.tasks, name)
    return pathExists(path)
  }

  installTask(source, name) {
    return this.loadTask(source)
      .then((task) => {
        let { path } = task.config
        name = name || task.name
        let newPath = resolvePath(this.config.tasks, name)

        if (path === newPath) {
          return newPath
        }

        return this.isTaskInstalled(name)
          .then((isInstalled) => {
            if (isInstalled) {
            // TODO: inquire for overwriting
              return emptyDir(newPath)
            }
          })
          .then(() => copy(path, newPath))
          .then(() => newPath)
      })
  }

  runTask(source, options) {
    return this.loadTask(source)
      .then((task) => {
        options = Object.assign(this.config.options, options)
        return task.run(options, this.config)
      })
  }
}


module.exports = CliTaskManager
