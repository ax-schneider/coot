const { makeSection } = require('./format')


const COLUMNS_CONFIG = {
  columnWidths: [30],
}


function makeNamesString(name, aliases = [], addDashes = false) {
  let names = [name, ...aliases]

  if (addDashes) {
    names = names.map((name) => {
      return (name.length > 1) ? `--${name}` : `-${name}`
    })
  }

  return names.join(', ')
}

function makeListSection(heading, options, addDashesToNames) {
  let rows = options.map(({ name, aliases, description }) => {
    let namesString = makeNamesString(name, aliases, addDashesToNames)
    return [namesString, description]
  })
  return makeSection(heading, rows, COLUMNS_CONFIG)
}

module.exports = function makeHelp(config) {
  let { usage, description, commands = [], options = [] } = config
  let visibleCommands = commands.filter((c) => !c.hidden)
  let positionalOptions = options.filter((o) => o.positional && !o.hidden)
  let nonPositionalOptions = options.filter((o) => !o.positional && !o.hidden)
  let sections = []

  if (description) {
    sections.push(description)
  }

  if (usage) {
    let rows = usage.map((row) => [row])
    let section = makeSection('USAGE', rows)
    sections.push(section)
  }

  if (visibleCommands.length) {
    let section = makeListSection('COMMANDS', visibleCommands)
    sections.push(section)
  }

  if (positionalOptions.length) {
    let section = makeListSection('POSITIONAL ARGUMENTS', positionalOptions)
    sections.push(section)
  }

  if (nonPositionalOptions.length) {
    let section = makeListSection('OPTIONS', nonPositionalOptions, true)
    sections.push(section)
  }

  return sections.join('\n\n')
}
