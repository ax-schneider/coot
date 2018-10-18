/* eslint-disable no-console */

const { inquireForOptions } = require('../utils/inquire')
const Coot = require('../Coot')
const Command = require('./Command')


class ICommand extends Command {
  _prepareOptions(options, ...args) {
    return new Promise((resolve, reject) => {
      if (options.template_id) {
        return resolve(options)
      }

      let optionConfigs = this.config.options.filter((o) => {
        return o.name === 'template_id' || o.name === 'template_name'
      })

      // TODO: derive the default templateName from templateId
      inquireForOptions(optionConfigs)
        .then((answers) => Object.assign({}, options, answers))
        .then(resolve, reject)
    }).then((options) => super._prepareOptions(options, ...args))
  }

  _handle({ templateId, templateName }) {
    return Coot.load(process.cwd())
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
