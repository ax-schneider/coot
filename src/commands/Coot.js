/* eslint-disable no-console */

const prompt = require('inquirer').createPromptModule()
const pkg = require('../../package.json')
const Command = require('./Command')
const I = require('./I')
const G = require('./G')
const T = require('./T')


class CootCommand extends Command {
  _handleDefault(options) {
    return this.coot.getInstalledTemplates()
      .then((templates) => prompt({
        type: 'list',
        name: 'templateName',
        message: 'Choose a template to generate:',
        choices: templates,
        default: templates[0],
      }))
      .then((answers) => {
        return this._handle(options, answers.templateName)
      })
  }

  _handle(options, ...args) {
    if (!args.length) {
      return this._handleDefault()
    } else {
      return this._runSubcommand('g', options, ...args)
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
