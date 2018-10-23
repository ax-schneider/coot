const { inquireForOption } = require('../utils/inquire')
const Command = require('./Command')


class SCommand extends Command {
  _prepareOptions(options, ...args) {
    return new Promise((resolve, reject) => {
      if (options.template_id) {
        return resolve(options)
      }

      let templateIdConfig = this.config.options.find(({ name }) => {
        return name === 'template_id'
      })
      let templateNameConfig = this.config.options.find(({ name }) => {
        return name === 'template_name'
      })

      // It could be simplified by using inquireForOptions,
      // but we need to derive the default value for the second question
      inquireForOption(templateIdConfig)
        .then((templateId) => {
          let defaultName = this.coot.getDirNameForTemplateId(templateId)
          templateNameConfig = Object.assign({}, templateNameConfig)
          templateNameConfig.defaultValue = defaultName

          return inquireForOption(templateNameConfig).then((templateName) => {
            return { templateId, templateName }
          })
        })
        .then((answers) => Object.assign({}, options, answers))
        .then(resolve, reject)
    }).then((options) => super._prepareOptions(options, ...args))
  }

  _handle({ templateId, templateName }) {
    return new Promise((resolve, reject) => {
      /* eslint-disable no-console */
      if (templateName) {
        console.log(`Saving ${templateId} as ${templateName}...`)
      } else {
        console.log(`Saving ${templateId}...`)
      }

      this.coot.saveTemplate(templateId, templateName)
        .then((path) => path && console.log(`Saved at ${path}`))
        .then(resolve, reject)
      /* eslint-enable no-console */
    })
  }
}

SCommand.config = {
  name: 's',
  description: 'Save a template to the templates dir',
  usage: ['s <template_id> [template_name]'],
  options: [{
    name: 'template_id',
    description: 'A local path or a git URL of the template to be saved',
    required: true,
    positional: true,
  }, {
    name: 'template_name',
    description: 'A name to save the template with',
    positional: true,
  }],
}


module.exports = SCommand
