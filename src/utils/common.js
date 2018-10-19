const Os = require('os')
const Path = require('path')


const HOME_DIR = Os.homedir()


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

// Ensure webpack does not break the require statement
// https://github.com/webpack/webpack/issues/4175
// https://github.com/webpack/webpack/issues/1021
function requireDynamically(path) {
  path = path.split('\\').join('/')
  // eslint-disable-next-line no-eval
  return eval(`require('${path}');`)
}

function readJson(path) {
  return new Promise((resolve) => {
    // TODO: make it truly async
    // TODO: strip json comments
    path = resolvePath(path)
    let result = requireDynamically(path)
    resolve(result)
  })
}

function findByName(configs, name, checkAllProps) {
  return configs.find((config) => {
    if (!checkAllProps) {
      return config.name === name
    }

    return config.name === name || config.finalName === name || (
      config.aliases && config.aliases.includes(name)
    )
  })
}


module.exports = { resolvePath, readJson, findByName }
