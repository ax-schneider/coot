const Task = require('../Task')
const parseArgs = require('../utils/parseArgs')
const makeHelp = require('../utils/makeHelp')


class Command extends Task {
  constructor(coot) {
    super()
    this.coot = coot
  }

  _prepareConfig() {
    let baseConfig = Command.baseConfig || {}
    let classConfig = this.constructor.config || {}
    let instanceConfig = this.config || {}
    let configs = [baseConfig, classConfig, instanceConfig]

    this.config = Object.assign({}, ...configs, { options: [], commands: [] })
    this.config.commands.push(
      ...this.constructor.commands.map((c) => c.config)
    )
    configs.forEach((c) => {
      this.config.commands.push(...(c.commands || []))
      this.config.options.push(...(c.options || []))
    })

    return super._prepareConfig()
  }

  _tap(options) {
    return Promise.resolve(options)
  }

  _handleHelp() {
    /* eslint-disable no-console */
    let help = makeHelp(this.config)
    console.log()
    console.log(help)
    console.log()
  }

  _handleVersion() {
    /* eslint-disable no-console */
    console.log(this.config.version || '0.0.0')
  }

  _runSubcommand(name, options, ...args) {
    return new Promise((resolve, reject) => {
      let Command = this.constructor.commands.find((c) => {
        return c.config.name === name
      })
      Command.create(this.coot)
        .then((command) => {
          return command.run(options, ...args)
        })
        .then(resolve, reject)
    })
  }

  run(taskOptions, ...args) {
    return new Promise((resolve, reject) => {
      let {
        options: argOptions, restArgs, command,
      } = parseArgs(this.config, args)
      let compositeOptions = Object.assign({}, taskOptions, argOptions)

      return this._prepareOptions(compositeOptions, ...restArgs)
        .then((options) => this._tap(options, ...restArgs))
        .then(
          (options) => {
            if (options.help) {
              return this._handleHelp(options, ...restArgs)
            } else if (options.version) {
              return this._handleVersion(options, ...restArgs)
            } else if (command) {
              return this._runSubcommand(command, options, ...restArgs)
            } else {
              return this._handle(options, ...restArgs)
            }
          },
          (err) => {
            console.error(`Error: ${err.message}`)
            return this._handleHelp(null, ...restArgs)
          }
        )
        .then(resolve, reject)
    })
  }
}

Command.commands = []
Command.baseConfig = {
  options: [{
    name: 'help',
    aliases: ['h'],
    description: 'Show help',
  }, {
    name: 'version',
    aliases: ['v'],
    description: 'Show current version',
  }, {
    name: 'cwd',
    description: 'Working directory',
    type: 'path',
    required: true,
    hidden: true,
  }],
}


module.exports = Command
