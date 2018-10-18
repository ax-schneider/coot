const prompt = require('inquirer').createPromptModule()


function inquireForOption(optionConfig) {
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
  return prompt(question).then((answer) => answer[name])
}

function inquireForOptions(optionConfigs) {
  let answers = {}
  return optionConfigs
    .reduce((promise, optionConfig) => {
      return promise
        .then(() => inquireForOption(optionConfig))
        .then((value) => (answers[optionConfig.finalName] = value))
    }, Promise.resolve())
    .then(() => answers)
}


module.exports = { prompt, inquireForOption, inquireForOptions }
