/* eslint-disable no-console */

const Command = require('./Command')


class GCommand extends Command {
  _handleHelp(options, ...args) {
    return this._handle(options, ...args)
  }

  _handle(options, ...args) {
    if (!options.templateId) {
      options.templateId = this.config.name
    }

    return this.coot.loadTemplate(options.templateId)
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
    required: true,
    positional: true,
  }],
}


module.exports = GCommand
