const camelcase = require('camelcase')
const coercers = require('./coercers')


class OptionNormalizer {
  constructor(schema = []) {
    this.schema = schema
  }

  _normalizeOptionName(schema, name) {
    if (schema) {
      name = schema.name
    }

    return camelcase(name)
  }

  _normalizeOptionValue(schema, value) {
    if (!schema) {
      return value
    }

    if (value === undefined || value === null) {
      if (schema.defaultValue !== undefined && schema.defaultValue !== null) {
        value = schema.defaultValue
      } else if (schema.required) {
        throw new Error(`Option "${schema.name}" is required`)
      }
    }

    if (!schema.type || value === undefined || value === null) {
      return value
    }

    return coercers[schema.type](value)
  }

  _normalizeOption(name, value) {
    let schema = this.schema.find((schema) => {
      return schema.name === name || (
        schema.aliases && schema.aliases.includes(name)
      )
    })

    return {
      name: this._normalizeOptionName(schema, name),
      value: this._normalizeOptionValue(schema, value),
    }
  }

  normalize(options = {}) {
    return Object.keys(options).reduce((result, key) => {
      let { name, value } = this._normalizeOption(key, options[key])
      result[name] = value
      return result
    }, {})
  }
}

module.exports = OptionNormalizer
