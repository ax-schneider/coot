/* eslint-disable no-console */

const pkg = require('../../package.json')
const Command = require('./Command')
const I = require('./I')
const G = require('./G')
const T = require('./T')


class CootCommand extends Command {
  _showInstalledTemplates() {
    return this.coot.getInstalledTemplates()
      .then((templates) => {
        console.log()

        if (templates.length) {
          console.log('INSTALLED TEMPLATES')
          templates.forEach((template) => console.log(` ${template}`))
        } else {
          console.log('There are no installed templates')
        }

        console.log()
      })
  }

  _handle(options, ...args) {
    if (args.length) {
      return this._runSubcommand('g', options, ...args)
    } else {
      return this._showInstalledTemplates()
    }
  }
}

CootCommand.commands = [I, G, T]
CootCommand.config = {
  name: 'coot',
  description: 'Coot',
  version: pkg.version,
  defaultCommand: 'g',
  usage: [
    'Show a list of the installed templates:',
    '  coot',
    '',
    'Generate a template:',
    '  coot [global options] <template_id> [template options]',
    '',
    'Execute a command:',
    '  coot <command> [options]',
  ],
}


module.exports = CootCommand
