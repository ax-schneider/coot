const Path = require('path')
const fs = require('fs-extra')
const { findByName, openEditor } = require('../utils/common')
const { inquireForOption } = require('../utils/inquire')
const Command = require('./Command')


class TCommand extends Command {
  _prepareOptions(options, ...args) {
    return new Promise((resolve, reject) => {
      if (options.template_name) {
        return resolve(options)
      }

      let optionConfig = findByName(this.config.options, 'template_name')
      return inquireForOption(optionConfig)
        // eslint-disable-next-line camelcase
        .then((template_name) => Object.assign({}, options, { template_name }))
        .then(resolve, reject)
    }).then((options) => super._prepareOptions(options, ...args))
  }

  _handle({ templateName, editor }) {
    return new Promise((resolve, reject) => {
      let config = this.coot.getConfig()
      let path = Path.join(config.templatesDir, templateName)

      fs.ensureDirSync(path)
      openEditor(editor || config.editor, [`"${path}"`])
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
