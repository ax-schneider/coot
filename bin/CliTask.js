const FileTask = require('../src/FileTask')


class CliTask extends FileTask {
  constructor(config, cliConfig) {
    super(config)
    this.cliConfig = cliConfig
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
