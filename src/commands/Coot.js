/* eslint-disable no-console */

const pkg = require('../../package.json')
const { resolvePath } = require('../utils/common')
const { inquire } = require('../utils/inquire')
const Coot = require('../Coot')
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
    let path = resolvePath(options.cwd, options.c)
    return Coot.load(path)
      .then((coot) => {
        this.coot = coot

        console.log(`Coot [${coot.configManager.path}]`)
        console.log()

        if (args.length) {
          return 'g'
        } else {
          return this._inquireForCommand()
        }
      })
      .then((command) => {
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
    'Show a list of the available commands:',
    '  coot',
    '',
    'Generate a template:',
    '  coot [global options] <template_id> [template options]',
    '',
    'Execute a command:',
    '  coot <command> [options]',
  ],
  options: [{
    name: 'c',
    description: 'Path to the config file',
  }],
}


module.exports = CootCommand
