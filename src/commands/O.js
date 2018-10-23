const Command = require('./Command')


class OCommand extends Command {
  _handle({ optionName }) {
    return new Promise((resolve) => {
      let { options } = this.coot.getConfig()

      // eslint-disable-next-line no-console
      console.log(options[optionName])
      resolve()
    })
  }
}

OCommand.config = {
  name: 'o',
  description: 'View the value of an option from the config',
  usage: ['o <option_name>'],
  options: [{
    name: 'option_name',
    description: 'The name of an option to view the value of',
    required: true,
    positional: true,
  }],
}


module.exports = OCommand
