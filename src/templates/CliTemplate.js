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

  _prepareOptions(options, ...args) {
    return new Promise((resolve, reject) => {
      let optionConfigs = this.config.options.filter((config) => {
        let { inquire, name, finalName } = config
        return inquire && (
          options[name] === undefined || options[name] === null
        ) && (
          options[finalName] === undefined || options[finalName] === null
        )
      })

      inquireForOptions(optionConfigs)
        .then((answers) => Object.assign({}, options, answers))
        .then(resolve, reject)
    }).then((options) => super._prepareOptions(options, ...args))
  }

  _handleHelp() {
    let help = makeHelp(this.config)

    /* eslint-disable no-console */
    console.log()
    console.log(help)
    console.log()
    /* eslint-enable no-console */
  }

  _handle(options) {
    return new Promise((resolve) => {
      if (options.help) {
        return this._handleHelp()
      }

      // eslint-disable-next-line no-console
      console.log(`Generating ${this.config.name}...`)
      let result = super._handle(options)
      resolve(result)
    })
  }
}


module.exports = CliTemplate
