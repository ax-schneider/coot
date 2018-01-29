const Os = require('os')
const Path = require('path')


const HOME_DIR = Os.homedir()


// Ensure webpack does not break the require statement
// https://github.com/webpack/webpack/issues/4175
// https://github.com/webpack/webpack/issues/1021
function requireDynamically(path) {
  path = path.split('\\').join('/')
  // eslint-disable-next-line no-eval
  return eval(`require('${path}');`)
}

function resolvePath(basePath, path) {
  if (!path) {
    path = basePath
    basePath = null
  }

  if (path[0] === '~') {
    path = Path.join(HOME_DIR, path.slice(1))
  }

  if (!basePath) {
    basePath = process.cwd()
  } else if (basePath[0] === '~') {
    basePath = Path.join(HOME_DIR, basePath.slice(1))
  }

  return Path.resolve(basePath, path)
}

function readConfig(path) {
  path = resolvePath(path)
  return requireDynamically(path)
}


module.exports = { resolvePath, readConfig }
