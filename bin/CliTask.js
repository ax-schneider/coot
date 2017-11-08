const template = require('lodash.template')
const change = require('gulp-change')
const rename = require('gulp-simple-rename')
const FileTask = require('../src/FileTask')


function templateHandler(files, options) {
  return files
    .pipe(change((contents) => template(contents)(options)))
    .pipe(rename((path) => template(path)(options)))
}


class CliTask extends FileTask {
  constructor(config, cliConfig) {
    super(config)

    this.cliConfig = cliConfig
    this.command.lifecycle.hook({
      event: 'handle',
      tags: ['handleCommand'],
      goesAfter: ['handleCommand'],
    }, this._makeHandler(templateHandler))
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


module.exports = CliTask
