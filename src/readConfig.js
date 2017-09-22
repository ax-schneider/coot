/* eslint-disable global-require */

const { extname } = require('path')
const { readFileSync } = require('fs')
const stripJsonComments = require('strip-json-comments')


module.exports = function readConfig(path) {
  let isJson = (extname(path).toLowerCase() === '.json')

  if (isJson) {
    let json = readFileSync(path, { encoding: 'utf8' })
    return JSON.parse(stripJsonComments(json))
  } else {
    return require(path)
  }
}
