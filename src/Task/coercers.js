const { resolvePath } = require('../utils/common')


const TRUTHY_VALUES = [true, 'true', 1, '1', 'yes', 'y']
const FALSY_VALUES = [false, 'false', 0, '0', 'no', 'n']


// TODO: improve error messages to include the option name

exports.string = function coerceToString(value) {
  return value.toString()
}

exports.boolean = function coerceToBoolean(value) {
  if (TRUTHY_VALUES.includes(value)) {
    return true
  } else if (FALSY_VALUES.includes(value)) {
    return false
  }

  throw new Error('The value cannot be converted to boolean')
}

exports.number = function coerceToNumber(value) {
  if (typeof value === 'string') {
    return Number(value)
  }

  throw new Error('The value cannot be converted to a number')
}

exports.path = function coerceToPath(value) {
  if (typeof value !== 'string') {
    throw new Error('The value must be a string')
  }

  return resolvePath(value)
}
