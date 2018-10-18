/* eslint-disable no-console */

const { prompt } = require('../utils/inquire')
const Command = require('./Command')


class GCommand extends Command {
  _prepareOptions(options, ...args) {
    return new Promise((resolve, reject) => {
      if (options.template_id) {
        return resolve(options)
      }

      this.coot.getInstalledTemplates()
        .then((templates) => {
          return prompt({
            type: 'list',
            name: 'template',
            message: 'Choose a template to generate:',
            choices: templates,
            default: templates[0],
          }).then((answer) => answer.template)
        })
        // eslint-disable-next-line camelcase
        .then((template_id) => Object.assign({}, options, { template_id }))
        .then(resolve, reject)
    }).then((options) => super._prepareOptions(options, ...args))
  }

  _handleHelp(options, ...args) {
    if (options.templateId) {
      return this._handle(options, ...args)
    } else {
      return super._handleHelp(options, ...args)
    }
  }

  _handle(options, ...args) {
    return this.coot.loadTemplate(options.templateId)
      .then((template) => template.run(options))
      .then((result) => {
        if (!args.length) {
          return result
        }

        return this.constructor.create(this.coot)
          .then((generate) => generate.run(null, ...args))
      })
  }
}


GCommand.config = {
  name: 'g',
  description: 'Generate a template',
  hidden: true,
  usage: ['g <template_id> [template options]'],
  options: [{
    name: 'template_id',
    description: 'A local path or a git URL of the template to generate',
    positional: true,
  }],
}


module.exports = GCommand
