const { openEditor } = require('../utils/common')
const Command = require('./Command')


class CCommand extends Command {
  _handle({ editor }) {
    return new Promise((resolve, reject) => {
      let config = this.coot.getConfig()
      openEditor(editor || config.editor, [`"${this.coot.configPath}"`])
        .then(resolve, reject)
    })
  }
}

CCommand.config = {
  name: 'c',
  description: 'Open the config in the editor',
  usage: ['c'],
  options: [{
    name: 'editor',
    description: 'The editor to open the config in',
  }],
}


module.exports = CCommand
