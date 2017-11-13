const { tmpdir } = require('os')
const Path = require('path')
const { pathExists, copy, emptyDir } = require('fs-extra')
const downloadGitRepo = require('download-git-repo')
const nanoid = require('nanoid/generate')
const { resolvePath } = require('../lib/utils')
const CliTask = require('./CliTask')


const TEMP_PATH = resolvePath(tmpdir(), 'coot')


function generateTempFolderName() {
  // The default alphabet is not compatible with appache's command names
  return nanoid('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 32)
}

function determineIdType(id) {
  if (/^[a-zA-Z0-9_-]+$/.test(id)) {
    return 'name'
  } else if (/^([a-zA-Z]:|[a-zA-Z]:[/\\]|\/|\.|~).*/.test(id)) {
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

function getNameFromGitUrl(id) {
  let regexp = /^((github|gitlab|bitbucket):)?((.+):)?([^/]+)\/([^#]+)(#(.+))?$/
  let matches = regexp.exec(normalizeGitUrl(id))
  return matches[6]
}

function downloadFromGit(src) {
  return new Promise((resolve, reject) => {
    let dest = Path.join(TEMP_PATH, generateTempFolderName())
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

  isTaskInstalled(name) {
    let path = resolvePath(this.tasksPath, name)
    return pathExists(path)
  }

  resolveTask(id) {
    return new Promise((resolve) => {
      let type = determineIdType(id)

      if (type === 'git') {
        resolve(downloadFromGit(id))
      } else if (type === 'name') {
        resolve(resolvePath(this.tasksPath, id))
      } else {
        resolve(id)
      }
    })
  }

  saveTask(path, name) {
    return new Promise((resolve, reject) => {
      path = resolvePath(path)
      let config = CliTask.loadConfig(path)
      config = CliTask.resolveConfig(config)
      name = name || config.name
      let newPath = resolvePath(this.tasksPath, name)

      if (path === newPath) {
        return resolve(newPath)
      }

      this.isTaskInstalled(name)
        .then((isInstalled) => {
          if (isInstalled) {
            // TODO: inquire for overwriting
            return emptyDir(newPath)
          }
        })
        .then(() => copy(path, newPath))
        .then(() => resolve(newPath))
        .catch(reject)
    })
  }

  installTask(id, name) {
    return this.resolveTask(id)
      .then((path) => {
        if (!name && determineIdType(id) === 'git') {
          name = getNameFromGitUrl(id)
        }
        return this.saveTask(path, name)
      })
  }

  loadTask(id) {
    return this.resolveTask(id).then((path) => CliTask.load(path))
  }
}


module.exports = CliTaskManager
