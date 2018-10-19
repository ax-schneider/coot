/* eslint-disable no-console */

const pkg = require('../../package.json')
const { inquire } = require('../utils/inquire')
const Command = require('./Command')
const I = require('./I')
const G = require('./G')
const T = require('./T')


class CootCommand extends Command {
  _inquireForCommand() {
    let choices = CootCommand.commands.map((command) => {
      let { name, description } = command.config
      return { name: `${name}) ${description}`, value: name }
    })
    return inquire({
      type: 'list',
      name: 'command',
      message: 'Choose a command to execute:',
      default: choices[0],
      choices,
    }).then((answer) => answer.command)
  }

  _handle(options, ...args) {
    let promise = args.length ? Promise.resolve('g') : this._inquireForCommand()
    return promise.then((command) => {
      return this._runSubcommand(command, options, ...args)
    })
  }
}

CootCommand.commands = [G, I, T]
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
