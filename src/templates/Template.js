const Path = require('path')
const fs = require('fs-extra')
const vinylFs = require('vinyl-fs')
const parseIgnore = require('parse-gitignore')
const vinylConflict = require('../vinylPlugins/conflict')
const template = require('../vinylPlugins/template')
const { resolvePath, findByName } = require('../utils/common')
const Task = require('../Task')


const IGNORE_FILE = '.cootignore'
const DEFAULT_CONFIG = {
  files: ['**'],
  ignore: [
    // These are mostly npm's hard ignores
    // https://docs.npmjs.com/misc/developers#keeping-files-out-of-your-package
    '.cootignore', '._*', '.git', 'CVS', '.svn', '.hg', '.*.swp',
    '.lock-wscript', '.wafpickle-N', 'node_modules', 'npm-debug.log',
    '.DS_Store', '.npmrc', 'config.gypi', '*.orig',
  ],
  options: [{
    name: 'dest',
    description: 'Destination directory',
    required: true,
  }],
}
const TEMPLATE_OPTIONS = {
  variable: 'o',
}
const PROXY_TRAPS = {
  get(target, prop) {
    if (!target.includes(prop)) {
      target.push(prop)
    }
  },
}


function interpolateFileStream(fileStream, options) {
  return fileStream.pipe(template(TEMPLATE_OPTIONS, options))
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
  return Object.assign({ name }, DEFAULT_CONFIG)
}

function loadIgnores(path) {
  return new Promise((resolve) => {
    fs.readFile(path, 'utf8', (err, contents) => {
      if (err) {
        return resolve([])
      }

      let ignores = parseIgnore(contents)
      return resolve(ignores)
    })
  })
}

function addOptionsToConfig(config, options) {
  let newConfig = Object.assign({}, config)
  newConfig.options = config.options.filter((option) => {
    let names = [option.name, ...(option.aliases || [])]

    if (option.finalName) {
      names.push(option.finalName)
    }

    return !names.find((name) => findByName(options, name, true))
  })
  newConfig.options.push(...options)
  return newConfig
}


class Template extends Task {
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

  _extractOptions() {
    return new Promise((resolve, reject) => {
      let optionNames = []
      let optionsProxy = new Proxy(optionNames, PROXY_TRAPS)
      let fileStream = this._src()
      interpolateFileStream(fileStream, optionsProxy)
        .on('data', () => {})
        .on('end', () => resolve(optionNames))
        .on('error', reject)
    }).then((optionNames) => {
      return optionNames.map((name) => ({ name, inquire: true }))
    })
  }

  _prepareConfig() {
    return new Promise((resolve, reject) => {
      this.config = makeTemplateConfigForPath(this.path)
      let ignoreFilePath = Path.join(this.path, IGNORE_FILE)

      loadIgnores(ignoreFilePath)
        .then((ignores) => {
          if (ignores.length) {
            this.config = Object.assign({}, this.config, {
              ignore: [...this.config.ignore, ...ignores],
            })
          }

          return this._extractOptions()
        })
        .then((options) => {
          this.config = addOptionsToConfig(this.config, options)
          return super._prepareConfig()
        })
        .then(resolve, reject)
    })
  }

  _src() {
    let { files, ignore } = this.config
    return vinylFs.src(files, {
      ignore,
      cwd: this.path,
      dot: true,
      allowEmpty: true,
    })
  }

  _dest(fileStream, options) {
    return fileStream.pipe(vinylFs.dest(options.dest))
  }

  _handle(options) {
    return new Promise((resolve, reject) => {
      let fileStream = this._src()
      fileStream = interpolateFileStream(fileStream, options)
      fileStream = fileStream.pipe(vinylConflict(options.dest))
      this._dest(fileStream, options)
        .on('end', resolve)
        .on('error', reject)
    })
  }
}


module.exports = Template
