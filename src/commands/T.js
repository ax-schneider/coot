const Path = require('path')
const { spawn } = require('child_process')
const fs = require('fs-extra')
const envEditor = require('env-editor')
const Command = require('./Command')


class TCommand extends Command {
  _handle({ templateName }) {
    if (!templateName) {
      return this._handleHelp()
    }

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

    return new Promise((resolve, reject) => {
      cp.on('error', reject)

      if (editorObj.isTerminalEditor) {
        cp.on('exit', resolve)
      } else {
        cp.unref()
        resolve()
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
