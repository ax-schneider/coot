const { tmpdir } = require('os')
const Path = require('path')
const { pathExists, copy, emptyDir } = require('fs-extra')
const downloadGitRepo = require('download-git-repo')
const { resolvePath } = require('../lib/utils')
const CliTask = require('./CliTask')


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

  throw new Error(`Unable to determing the source type of "${source}"`)
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
  constructor(tasksPath) {
    this.tasksPath = tasksPath
  }

  loadTask(source, ...args) {
    return new Promise((resolve) => {
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
        path = resolvePath(this.tasksPath, source)
        config = CliTask.loadConfig(path)
      }

      return resolve(config)
    }).then((config) => {
      return new CliTask(config, ...args)
    })
  }

  isTaskInstalled(name) {
    let path = resolvePath(this.tasksPath, name)
    return pathExists(path)
  }

  installTask(source, name) {
    return this.loadTask(source)
      .then((task) => {
        let { path } = task.config
        name = name || task.name
        let newPath = resolvePath(this.tasksPath, name)

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
}


module.exports = CliTaskManager
