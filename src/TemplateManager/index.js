const Path = require('path')
const { tmpdir } = require('os')
const fs = require('fs-extra')
const downloadGitRepo = require('download-git-repo')
const parseGitUrl = require('parse-github-url')
const { resolvePath } = require('../utils/common')
const { inquire } = require('../utils/inquire')
const CliTemplate = require('../templates/CliTemplate')


const TEMP_PATH = resolvePath(tmpdir(), 'coot')


function inquireForConfirmation() {
  return inquire({
    type: 'confirm',
    name: 'confirm',
    message: 'Replace the existing template?',
  }).then((answer) => answer.confirm)
}


// This class isn't supposed to know anything about the CLI,
// but for now it inquires and uses CliTemplate
class TemplateManager {
  constructor(config) {
    this.config = config
  }

  parseTemplateId(id) {
    if (/^([a-zA-Z]:|\.\.?|~)?([/\\].*)?$/.test(id)) {
      return { type: 'path', name: Path.basename(id), id }
    } else if (!/[/\\]/.test(id)) {
      return { type: 'name', name: id, id }
    } else {
      let { name } = parseGitUrl(id)

      if (!name) {
        throw new Error(`Unable to parse Git URL ${id}`)
      }

      // download-git-repo doesn't understand regular HTTPS github urls
      if (id.startsWith('https://github.com/')) {
        id = id.slice(19)
      }

      return { type: 'git', name, id }
    }
  }

  resolveTemplateId(templateId) {
    return new Promise((resolve, reject) => {
      let { type, name, id } = this.parseTemplateId(templateId)

      if (type === 'git') {
        let dest = resolvePath(TEMP_PATH, name)
        return downloadGitRepo(id, dest, (err) => {
          err ? reject(err) : resolve(dest)
        })
      } else if (type === 'name') {
        return resolve(resolvePath(this.config.templatesDir, id))
      } else {
        return resolve(id)
      }
    })
  }

  loadTemplate(id) {
    return this.resolveTemplateId(id)
      .then(
        (path) => {
          return CliTemplate.create(path)
        },
        (err) => {
          throw new Error(`Unable to load template ${id}: ${err.message}`)
        }
      )
  }

  isTemplateSaved(name) {
    return new Promise((resolve) => {
      let path = resolvePath(this.config.templatesDir, name)
      return resolve(fs.pathExists(path))
    })
  }

  getSavedTemplates() {
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

  saveTemplate(id, name) {
    return this.loadTemplate(id)
      .then((template) => {
        let path = template.path
        name = name || template.config.name
        let newPath = resolvePath(this.config.templatesDir, name)

        if (path === newPath) {
          return newPath
        }

        return this.isTemplateSaved(name)
          .then((exists) => {
            return exists ? inquireForConfirmation() : true
          })
          .then((answer) => {
            if (answer) {
              return fs.emptyDir(newPath)
                .then(() => fs.copy(path, newPath))
                .then(() => true)
            }
          })
          .then((saved) => {
            return saved ? newPath : false
          })
      })
  }
}


module.exports = TemplateManager
