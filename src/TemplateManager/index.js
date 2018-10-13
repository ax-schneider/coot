const Path = require('path')
const { tmpdir } = require('os')
const fs = require('fs-extra')
const downloadGitRepo = require('download-git-repo')
const { resolvePath } = require('../utils/common')
const Template = require('../commands/Template')


const TEMP_PATH = resolvePath(tmpdir(), 'coot')


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

function getNameFromGitUrl(url) {
  let regexp = /^((github|gitlab|bitbucket):)?((.+):)?([^/]+)\/([^#]+)(#(.+))?$/
  let matches = regexp.exec(normalizeGitUrl(url))
  return matches[6]
}

function downloadFromGit(dir, src) {
  return new Promise((resolve, reject) => {
    let dest = Path.join(dir, getNameFromGitUrl(src))
    src = normalizeGitUrl(src)

    return downloadGitRepo(src, dest, (err) => {
      return err ? reject(err) : resolve(dest)
    })
  })
}


// TEMP PATH vs TEMPLATES DIR ??
function resolveTemplateId(dir, id) {
  return new Promise((resolve) => {
    let type = determineIdType(id)

    if (type === 'git') {
      return resolve(downloadFromGit(TEMP_PATH, id))
    } else if (type === 'name') {
      return resolve(resolvePath(dir, id))
    } else {
      return resolve(id)
    }
  })
}


class TemplateManager {
  constructor(config) {
    this.config = config
  }

  loadTemplate(id) {
    return resolveTemplateId(this.config.templatesDir, id)
      .then(
        (path) => {
          return Template.create(path)
        },
        (err) => {
          throw new Error(`Unable to load template ${id}: ${err.message}`)
        }
      )
  }

  isTemplateInstalled(name) {
    return new Promise((resolve) => {
      let path = resolvePath(this.config.templatesDir, name)
      return resolve(fs.pathExists(path))
    })
  }

  getInstalledTemplates() {
    return new Promise((resolve, reject) => {
      let { templatesDir } = this.config
      fs.readdir(templatesDir, (err, entries) => {
        if (err) {
          return reject(err)
        }

        try {
          let templates = entries.filter((entry) => {
            // TODO: make async
            let path = Path.join(templatesDir, entry)
            return fs.statSync(path).isDirectory()
          })
          resolve(templates)
        } catch (err) {
          reject(err)
        }
      })
    })
  }

  installTemplate(id, name) {
    return this.loadTemplate(id)
      .then((template) => {
        let path = template.path
        name = name || template.config.name
        let newPath = resolvePath(this.config.templatesDir, name)

        if (path === newPath) {
          return newPath
        }

        return this.isTemplateInstalled(name)
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
}


module.exports = TemplateManager
