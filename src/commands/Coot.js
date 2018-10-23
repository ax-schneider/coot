const pkg = require('../../package.json')
const { resolvePath } = require('../utils/common')
const { inquire } = require('../utils/inquire')
const Coot = require('../Coot')
const Command = require('./Command')
const S = require('./S')
const G = require('./G')
const T = require('./T')
const C = require('./C')
const O = require('./O')


class CootCommand extends Command {
  _tap(options, ...args) {
    return new Promise((resolve, reject) => {
      let path = resolvePath(options.cwd, options.c)
      Coot.load(path)
        .then((coot) => {
          this.coot = coot
          return super._tap(options, ...args)
        })
        .then(resolve, reject)
    })
  }

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
    return new Promise((resolve) => {
      /* eslint-disable no-console */
      console.log(`Coot [${this.coot.configPath}]`)
      console.log()
      /* eslint-enable no-console */

      if (args.length) {
        resolve('g')
      } else {
        let result = this._inquireForCommand()
        resolve(result)
      }
    }).then((command) => {
      return this._runSubcommand(command, options, ...args)
    })
  }
}

CootCommand.commands = [G, S, T, C, O]
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
