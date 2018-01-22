/* eslint-disable no-console */

const fs = require('fs')
const Path = require('path')
const template = require('lodash.template')
const change = require('gulp-change')
const rename = require('gulp-simple-rename')
const conflict = require('gulp-conflict')
const normalizePackageData = require('normalize-package-data')
const readPackageJson = require('read-package-json')
const { resolvePath } = require('../lib/utils')
const FileTask = require('../lib/FileTask')


const DEFAULT_CONFIG = {
  // npm's defaults for files
  files: [
    '**', '!._*', '!package.json', '!.git', '!CVS', '!.svn', '!.hg', '!.*.swp',
    '!.lock-wscript', '!.wafpickle-N', '!node_modules', '!npm-debug.log',
    '!.DS_Store', '!.npmrc', '!config.gypi', '!*.orig', '!package-lock.json',
  ],
}


function templateHandler(files, options) {
  return files
    .pipe(change((contents) => template(contents)(options)))
    .pipe(rename((path) => template(path)(options)))
}

function conflictHandler(files, options) {
  return files.pipe(conflict(options.dest, {
    logger: () => {},
  }))
}


class CliTask extends FileTask {
  static loadConfig(path, normalize = true) {
    return new Promise((resolve, reject) => {
      path = resolvePath(path)

      if (!fs.existsSync(path)) {
        throw new Error(`Path ${path} doesn't exist`)
      }

      let isDir = !Path.extname(path)
      let basename = Path.basename(path)
      let dir = path

      if (isDir) {
        path = Path.join(path, 'package.json')
      } else if (basename === 'package.json') {
        dir = Path.dirname(path)
      } else {
        throw new Error(
          'A task config path must be a directory or a package.json file, ' +
          `given: ${path}`
        )
      }

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

        if (normalize) {
          config = this.normalizeConfig(config)
        }

        return resolve(config)
      })
    })
  }

  static normalizeConfig(config) {
    config = Object.assign({}, DEFAULT_CONFIG, config)

    if (!config.dir) {
      throw new Error('"dir" property is required in a task config')
    }

    normalizePackageData(config)
    config = super.normalizeConfig(config)
    config.options.src.defaultValue = config.dir

    return config
  }

  static load(path) {
    return this.loadConfig(path, false)
      .then(
        (config) => {
          return new this(config)
        },
        (err) => {
          throw new Error(`Unable to load task at ${path}: ${err.message}`)
        }
      )
  }

  _makeHandlerArgs(command, result) {
    if (Array.isArray(result)) {
      return result.slice()
    }

    let args = super._makeHandlerArgs(command, result)
    args.push(this.cliConfig)
    return args
  }
}

CliTask.endHandlers = FileTask.endHandlers.concat(
  conflictHandler, templateHandler
)


module.exports = CliTask
