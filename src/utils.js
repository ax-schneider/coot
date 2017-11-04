const Os = require('os')
const { extname, resolve, join } = require('path')
const { readFileSync } = require('fs')
const stripJsonComments = require('strip-json-comments')


const HOME_DIR = Os.homedir()


function resolvePath(basePath, path) {
  if (!path) {
    path = basePath
    basePath = null
  }

  if (path[0] === '~') {
    path = join(HOME_DIR, path.slice(1))
  }

  if (basePath && basePath[0] === '~') {
    basePath = join(HOME_DIR, basePath.slice(1))
  }

  if (basePath) {
    return resolve(basePath, path)
  } else {
    return path
  }
}

function readConfig(path) {
  path = resolvePath(path)
  let isJson = (extname(path).toLowerCase() === '.json')

  if (isJson) {
    let json = readFileSync(path, { encoding: 'utf8' })
    return JSON.parse(stripJsonComments(json))
  } else {
    // eslint-disable-next-line global-require
    return require(path)
  }
}


module.exports = { resolvePath, readConfig }
