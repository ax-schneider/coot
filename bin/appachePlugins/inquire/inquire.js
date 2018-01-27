const { findByIds } = require('comanche/common')
const prompt = require('inquirer').createPromptModule()


function* inquireForOption(optionConfig) {
  let { name, description, inquire, defaultValue } = optionConfig
  let endChar, message, type

  if (optionConfig.type === 'boolean') {
    type = 'confirm'
    endChar = '?'
  } else {
    type = 'input'
    endChar = ':'
  }

  if (typeof inquire === 'string') {
    message = inquire
  } else if (description) {
    message = description + endChar
  } else {
    message = name[0].toUpperCase() + name.substr(1) + endChar
  }

  let question = {
    name, type, message,
    default: defaultValue,
  }
  let answer = yield prompt(question)
  return answer[name]
}

function findOption(options, optionConfig) {
  return options && options.find((option) => {
    return option.name === optionConfig.name
  })
}

function findInquireableOptionConfigs(config, command) {
  let optionIds = command.config && command.config.options

  if (!optionIds || !optionIds.length) {
    return []
  }

  let optionConfigs = findByIds(config.options, optionIds)
    .filter((optionConfig) => optionConfig.inquire)

  return optionConfigs
}


module.exports = function* inquire(config, command) {
  let optionConfigs = findInquireableOptionConfigs(config, command)
  let options = command.options ? command.options.slice() : []

  for (let i = 0; i < optionConfigs.length; i++) {
    let optionConfig = optionConfigs[i]

    if (findOption(options, optionConfig)) {
      continue
    }

    let value = yield* inquireForOption(optionConfig)

    options.push({
      value,
      name: optionConfig.name,
      config: optionConfig,
    })
  }

  return Object.assign({}, command, { options })
}
