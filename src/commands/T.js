const Path = require('path')
const { openEditor } = require('../utils/common')
const { inquire } = require('../utils/inquire')
const Command = require('./Command')


class TCommand extends Command {
  _prepareOptions(options, ...args) {
    return new Promise((resolve, reject) => {
      if (options.template_name) {
        return resolve(options)
      }

      this.coot.getSavedTemplates()
        .then((templates) => {
          return inquire({
            type: 'list',
            name: 'template',
            message: 'Choose a template to open:',
            choices: templates,
            default: templates[0],
          }).then((answer) => answer.template)
        })
        // eslint-disable-next-line camelcase
        .then((template_name) => Object.assign({}, options, { template_name }))
        .then(resolve, reject)
    }).then((options) => super._prepareOptions(options, ...args))
  }

  _handle({ templateName, editor }) {
    return new Promise((resolve, reject) => {
      this.coot.isTemplateSaved(templateName)
        .then((isSaved) => {
          if (isSaved) {
            // eslint-disable-next-line no-console
            console.log(`Opening ${templateName}...`)
          } else {
            // eslint-disable-next-line no-console
            console.log(`Creating and opening ${templateName}...`)
            return this.coot.createTemplate(templateName)
          }
        })
        .then(() => {
          let config = this.coot.getConfig()
          let path = Path.join(config.templatesDir, templateName)
          return openEditor(editor || config.editor, [`"${path}"`])
        })
        .then(resolve, reject)
    })
  }
}

TCommand.config = {
  name: 't',
  description: 'Create a template if it doesn\'t exist and open it in the editor',
  usage: ['t <template_name>'],
  options: [{
    name: 'template_name',
    description: 'The name of the template',
    positional: true,
    required: true,
  }, {
    name: 'editor',
    description: 'The editor to open the template in',
  }],
}


module.exports = TCommand
