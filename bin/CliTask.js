/* eslint-disable no-console */

const normalizePackageData = require('normalize-package-data')
const FileTask = require('../lib/FileTask')
const { interpolateFileStream: templateHandler } = require('./utils/templates')
const appacheInquire = require('./appachePlugins/inquire')
const vinylConflict = require('./vinylPlugins/conflict')


const DEFAULT_CONFIG = {
  // npm's defaults for files
  files: [
    '**', '!._*', '!package.json', '!.git', '!CVS', '!.svn', '!.hg', '!.*.swp',
    '!.lock-wscript', '!.wafpickle-N', '!node_modules', '!npm-debug.log',
    '!.DS_Store', '!.npmrc', '!config.gypi', '!*.orig', '!package-lock.json',
  ],
}


function conflictHandler(files, options) {
  return files.pipe(vinylConflict(options.dest))
}


class CliTask extends FileTask {
  static normalizeConfig(config) {
    config = Object.assign({}, DEFAULT_CONFIG, config)
    config.options = Object.assign({}, DEFAULT_CONFIG.options, config.options)

    if (!config.dir) {
      throw new Error('"dir" property is required in a task config')
    }

    normalizePackageData(config)
    config = super.normalizeConfig(config)
    config.options.src.defaultValue = config.dir

    return config
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

CliTask.plugins = FileTask.plugins.concat(appacheInquire)
CliTask.endHandlers = FileTask.endHandlers.concat(
  conflictHandler, templateHandler
)


module.exports = CliTask
