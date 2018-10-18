/* eslint-disable no-console */

const { inquireForOptions } = require('../utils/inquire')
const Coot = require('../Coot')
const Command = require('./Command')


class ICommand extends Command {
  _installTemplate(id, name) {
    return Coot.load(process.cwd())
      .then((coot) => {
        if (name) {
          console.log(`Installing ${id} as ${name}...`)
        } else {
          console.log(`Installing ${id}...`)
        }
        return coot.installTemplate(id, name)
      })
      .then(
        (path) => path && console.log(`Installed at ${path}`),
        (err) => console.error(err)
      )
  }

  _handle({ templateId, templateName }) {
    if (templateId) {
      return this._installTemplate(templateId, templateName)
    }

    let optionConfigs = this.config.options.filter((o) => {
      return o.name === 'template_id' || o.name === 'template_name'
    })

    // TODO: derive the default templateName from templateId
    return inquireForOptions(optionConfigs)
      .then(({ templateId, templateName }) => {
        if (templateId) {
          return this._installTemplate(templateId, templateName)
        } else {
          return this._handleHelp()
        }
      })
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
