/* eslint-disable no-console */

const Coot = require('../Coot')
const Command = require('./Command')


class ICommand extends Command {
  _handle({ templateId, templateName }) {
    if (!templateId) {
      return this._handleHelp()
    }

    Coot.load(process.cwd())
      .then((coot) => {
        if (templateName) {
          console.log(`Installing ${templateId} as ${templateName}...`)
        } else {
          console.log(`Installing ${templateId}...`)
        }
        return coot.installTemplate(templateId, templateName)
      })
      .then(
        (path) => path && console.log(`Installed at ${path}`),
        (err) => console.error(err)
      )
  }
}

ICommand.config = {
  name: 'i',
  description: 'Install a template to the templates dir',
  usage: ['i <template_id> [template_name]'],
  options: [{
    name: 'template_id',
    description: 'A local path or a git URL of the template to be installed',
    required: true,
    positional: true,
  }, {
    name: 'template_name',
    description: 'A name to save the template with',
    positional: true,
  }],
}


module.exports = ICommand
