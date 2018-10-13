const fs = require('fs')
const Path = require('path')
const { Transform } = require('stream')
const vinylFs = require('vinyl-fs')
const vinylConflict = require('../vinylPlugins/conflict')
const { resolvePath } = require('../utils/common')
const {
  interpolateFileStream, fillConfigWithTemplateOptions,
} = require('../utils/templates')
const Command = require('./Command')


const DEFAULT_CONFIG = {
  files: ['**'],
  ignore: [ // These are mostly npm's hard ignores
    '._*', '.git', 'CVS', '.svn', '.hg', '.*.swp', '.lock-wscript',
    '.wafpickle-N', 'node_modules', 'npm-debug.log', '.DS_Store',
    '.npmrc', 'config.gypi', '*.orig', 'package-lock.json',
  ],
}

function validateTemplatePath(path) {
  return new Promise((resolve, reject) => {
    fs.lstat(path, (err, stats) => {
      if (err && err.code === 'ENOENT') {
        err = new Error(
          'The following path is not a valid template path ' +
          `because it doesn't exist: ${path}`
        )
      } else if (!err && !stats.isDirectory()) {
        err = new Error(
          'The following path is not a valid template path ' +
          `because it is not a directory: ${path}`
        )
      }

      err ? reject(err) : resolve()
    })
  })
}

function makeTemplateConfigForPath(path) {
  let name = Path.basename(path)
  return Object.assign({ name, description: name }, DEFAULT_CONFIG)
}


class Template extends Command {
  static create(path) {
    return new Promise((resolve, reject) => {
      path = resolvePath(path)
      validateTemplatePath(path)
        .then(() => super.create(path))
        .then(resolve, reject)
    })
  }

  constructor(path) {
    super()
    this.path = resolvePath(path)
  }

  _prepareConfig() {
    return new Promise((resolve, reject) => {
      let config = makeTemplateConfigForPath(this.path)
      fillConfigWithTemplateOptions(config, this.path)
        .then((config) => {
          this.config = config
          return super._prepareConfig()
        })
        .then(resolve, reject)
      // TODO: load ignores from .cootignore
    })
  }

  _src() {
    let { files, ignore } = this.config

    if (files && files.length) {
      return vinylFs.src(files, {
        ignore,
        cwd: this.path,
        dot: true,
        allowEmpty: true,
      })
    } else {
      return new Transform()
    }
  }

  _dest(fileStream, options) {
    return fileStream.pipe(vinylFs.dest(options.dest))
  }

  _handle(options) {
    return new Promise((resolve, reject) => {
      /* eslint-disable no-console */
      console.log(`Generating ${this.config.name}...`)

      if (!options.dest) {
        // TODO: add the "path" option type
        options = Object.assign({}, options, { dest: process.cwd() })
      }

      let fileStream = this._src()
      fileStream = fileStream.pipe(vinylConflict(options.dest))
      fileStream = interpolateFileStream(fileStream, options)
      this._dest(fileStream, options)
        .on('end', resolve)
        .on('error', reject)
    })
  }
}


module.exports = Template
