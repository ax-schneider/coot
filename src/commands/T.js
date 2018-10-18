const Path = require('path')
const { spawn } = require('child_process')
const fs = require('fs-extra')
const envEditor = require('env-editor')
const { inquireForOption } = require('../utils/inquire')
const Command = require('./Command')


class TCommand extends Command {
  _createTemplate(templateName) {
    return new Promise((resolve, reject) => {
      let config = this.coot.getConfig()
      let path = Path.join(config.templatesDir, templateName)
      let { editor } = config.options
      let editorObj = editor ? envEditor.get(editor) : envEditor.default()

      fs.ensureDirSync(path)

      let cp = spawn(editorObj.bin, [`"${path}"`], {
        shell: true,
        detached: true,
        stdio: editorObj.isTerminalEditor ? 'inherit' : 'ignore',
      })

      cp.on('error', reject)

      if (editorObj.isTerminalEditor) {
        cp.on('exit', resolve)
      } else {
        cp.unref()
        resolve()
      }
    })
  }

  _handle({ templateName }) {
    if (templateName) {
      return this._createTemplate(templateName)
    }

    let optionConfig = this.config.options.find((o) => {
      return o.name === 'template_name'
    })
    return inquireForOption(optionConfig)
      .then((templateName) => {
        if (templateName) {
          return this._createTemplate(templateName)
        } else {
          return this._handleHelp()
        }
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
  }],
}


module.exports = TCommand
