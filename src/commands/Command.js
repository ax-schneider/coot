const prompt = require('inquirer').createPromptModule()
const Task = require('../Task')
const parseArgs = require('../utils/parseArgs')
const makeHelp = require('../utils/makeHelp')


function inquireForOption(optionConfig) {
  let { name, description, inquire, defaultValue } = optionConfig
  let endChar, message, type

  if (optionConfig.type === 'boolean') {
    type = 'confirm'
    endChar = '?'
  } else {
    type = 'input'
    endChar = ':'
  }

  if (typeof inquire === 'string') {
    message = inquire
  } else if (description) {
    message = description + endChar
  } else {
    message = name[0].toUpperCase() + name.substr(1) + endChar
  }

  let question = {
    name, type, message,
    default: defaultValue,
  }
  return prompt(question).then((answer) => answer[name])
}


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

  _inquireForOptions(options) {
    options = Object.assign({}, options)
    return this.config.options
      .filter(({ required, finalName }) => {
        return required && (
          options[finalName] === undefined || options[finalName] === null
        )
      })
      .reduce((promise, optionConfig) => {
        return promise
          .then(() => inquireForOption(optionConfig))
          .then((value) => (options[optionConfig.finalName] = value))
      }, Promise.resolve())
      .then(() => options)
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
    let Command = this.constructor.commands.find((c) => c.config.name === name)
    return Command.create(this.coot).then((command) => {
      return command.run(options, ...args)
    })
  }

  run(taskOptions, ...args) {
    return new Promise((resolve) => {
      let {
        options: argOptions, restArgs, command,
      } = parseArgs(this.config, args)
      let compositeOptions = Object.assign({}, argOptions, taskOptions)
      let options = this._prepareOptions(compositeOptions)
      let result

      if (options.help) {
        result = this._handleHelp(options, ...restArgs)
      } else if (options.version) {
        result = this._handleVersion(options, ...restArgs)
      } else if (command) {
        result = this._runSubcommand(command, options, ...restArgs)
      } else {
        result = this._inquireForOptions(options)
          .then((options) => this._handle(options, ...restArgs))
      }

      resolve(result)
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
  }],
}


module.exports = Command
