const { inquireForOptions } = require('../utils/inquire')
const makeHelp = require('../utils/makeHelp')
const Template = require('./Template')


class CliTemplate extends Template {
  _prepareConfig() {
    return super._prepareConfig()
      .then(() => {
        this.config.description = this.config.name
      })
  }

  _inquireForOptions(options) {
    return new Promise((resolve) => {
      let configs = this.config.options.filter(({ required, finalName }) => {
        return required && (
          options[finalName] === undefined || options[finalName] === null
        )
      })
      let result = inquireForOptions(configs)
        .then((answers) => Object.assign({}, options, answers))
      resolve(result)
    })
  }

  _handleHelp() {
    /* eslint-disable no-console */
    let help = makeHelp(this.config)
    console.log()
    console.log(help)
    console.log()
  }

  _handle(options) {
    if (options.help) {
      return this._handleHelp()
    }

    return this._inquireForOptions(options)
      .then((options) => {
        /* eslint-disable no-console */
        console.log(`Generating ${this.config.name}...`)

        if (!options.dest) {
          // TODO: add the "path" option type
          options = Object.assign({}, options, { dest: process.cwd() })
        }

        return super._handle(options)
      })
  }
}


module.exports = CliTemplate
