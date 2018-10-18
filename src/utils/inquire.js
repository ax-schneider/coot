const prompt = require('inquirer').createPromptModule()


function makeQuestion(optionConfig) {
  let { name, finalName, description, inquire, defaultValue } = optionConfig
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

  return {
    name: finalName, type, message,
    default: defaultValue,
  }
}

function inquireForOption(optionConfig) {
  let question = makeQuestion(optionConfig)
  return prompt(question).then((answer) => answer[question.name])
}

function inquireForOptions(optionConfigs) {
  let questions = optionConfigs.map(makeQuestion)
  return prompt(questions)
}


module.exports = { prompt, inquireForOption, inquireForOptions }
