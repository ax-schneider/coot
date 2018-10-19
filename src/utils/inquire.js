const prompt = require('inquirer').createPromptModule()


const BASE_QUESTION = {
  filter: (value) => {
    return value.length ? value : null
  },
  transformer: (value) => {
    if (value === undefined || value === null) {
      return ''
    } else {
      return value
    }
  },
}


function makeQuestion(optionConfig) {
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

  return {
    name, type, message,
    default: defaultValue,
  }
}

function inquire(questions) {
  if (Array.isArray(questions)) {
    questions = questions.map((question) => {
      return Object.assign({}, BASE_QUESTION, question)
    })
  } else {
    questions = Object.assign({}, BASE_QUESTION, questions)
  }

  return prompt(questions)
}

function inquireForOption(optionConfig) {
  let question = makeQuestion(optionConfig)
  return inquire(question).then((answer) => answer[question.name])
}

function inquireForOptions(optionConfigs) {
  let questions = optionConfigs.map(makeQuestion)
  return inquire(questions)
}


module.exports = { inquire, inquireForOption, inquireForOptions }
