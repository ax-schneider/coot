const camelcase = require('camelcase')
const { findByName } = require('../utils/common')
const coercers = require('./coercers')


function normalizeOption({ name, value, config = {} }) {
  let displayName = name || config.name || config.finalName

  if (config.finalName) {
    name = config.finalName
  } else if (name) {
    name = camelcase(name)
  } else if (config.name) {
    name = config.name
  } else {
    throw new Error('Unable to determine option name')
  }

  if (value === undefined || value === null) {
    value = config.defaultValue
  }

  if (
    config.type && coercers[config.type] &&
    value !== undefined && value !== null
  ) {
    value = coercers[config.type](value)
  }

  if (config.required && (value === undefined || value === null)) {
    throw new Error(`Option "${displayName}" is required`)
  }

  return { name, value }
}

function normalizeOptions(optionConfigs, options = {}) {
  let passedOptions = Object.keys(options).map((name) => {
    let value = options[name]
    let config = findByName(optionConfigs, name, true)
    return { name, value, config }
  })
  let definedOptions = optionConfigs
    .filter((config) => {
      return !passedOptions.find((o) => o.config === config)
    })
    .map((config) => ({ config }))

  return [...passedOptions, ...definedOptions].reduce((results, option) => {
    let { name, value } = normalizeOption(option)

    if (value !== undefined && value !== null) {
      results[name] = value
    }

    return results
  }, {})
}


module.exports = normalizeOptions
