/* eslint-disable no-console */

const { prompt } = require('../utils/inquire')
const Command = require('./Command')


class GCommand extends Command {
  _handleHelp(options, ...args) {
    return this._handle(options, ...args)
  }

  _inquireForTemplateName() {
    return this.coot.getInstalledTemplates()
      .then((templates) => {
        return prompt({
          type: 'list',
          name: 'template',
          message: 'Choose a template to generate:',
          choices: templates,
          default: templates[0],
        }).then((answer) => answer.template)
      })
  }

  _handle(options, ...args) {
    let promise = options.templateId ?
      Promise.resolve(options.templateId) :
      this._inquireForTemplateName()

    return promise
      .then((templateId) => this.coot.loadTemplate(templateId))
      .then((template) => template.run(options))
      .then((result) => {
        if (!args.length) {
          return result
        }

        return this.constructor.create(this.coot)
          .then((generate) => {
            return generate.run({ templateId: args.shift() }, ...args)
          })
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
