function parseOption(option) {
  let startPos = (option[1] === '-') ? 2 : 1
  let [name, value] = option.slice(startPos).split('=')

  if (!name) {
    throw new Error('An option must have a name')
  }

  if (value === undefined) {
    value = true
  }

  return { name, value }
}

module.exports = function parseArgs(config, args) {
  let commandNames = config.commands.map((c) => c.name)
  let positionals = config.options.filter((o) => o.positional)
  let restArgs = [...args]
  let options = {}
  let command

  while (restArgs.length) {
    let arg = restArgs.shift()

    if (arg[0] === '-') {
      let { name, value } = parseOption(arg)
      options[name] = value
    } else if (commandNames.includes(arg)) {
      command = arg
      break
    } else if (positionals.length) {
      let { name } = positionals.shift()
      options[name] = arg
    } else {
      restArgs.unshift(arg)
      break
    }
  }

  return { restArgs, options, command }
}
