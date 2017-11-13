const Os = require('os')
const { extname, resolve, join } = require('path')
const requireJSON5 = require('require-json5')


const HOME_DIR = Os.homedir()


function resolvePath(basePath, path) {
  if (!path) {
    path = basePath
    basePath = null
  }

  if (path[0] === '~') {
    path = join(HOME_DIR, path.slice(1))
  }

  if (!basePath) {
    basePath = process.cwd()
  } else if (basePath[0] === '~') {
    basePath = join(HOME_DIR, basePath.slice(1))
  }

  return resolve(basePath, path)
}

function readConfig(path) {
  path = resolvePath(path)
  let isJson = (extname(path).toLowerCase() === '.json')

  if (isJson) {
    return requireJSON5(path)
  } else {
    // eslint-disable-next-line global-require
    return require(path)
  }
}


module.exports = { resolvePath, readConfig }
