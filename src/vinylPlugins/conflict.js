const Path = require('path')
const fs = require('fs-extra')
const through2 = require('through2')
const PluginError = require('plugin-error').bind(null, 'conflict')
const { inquire } = require('../utils/inquire')


const CHOICES = [{
  key: 'y',
  name: 'Replace',
  value: 'replace',
}, {
  key: 'n',
  name: 'Do not replace',
  value: 'skip',
}, {
  key: 'a',
  name: 'Replace this and all others',
  value: 'replaceAll',
}, {
  key: 's',
  name: 'Skip this and all others',
  value: 'skipAll',
}, {
  key: 'x',
  name: 'Abort',
  value: 'end',
}]


function inquireForReplacement(file) {
  let question = {
    type: 'list',
    name: 'replace',
    message: `Replace ${file.relative}?`,
    default: 0,
    choices: CHOICES,
  }
  return inquire([question]).then((answers) => answers.replace)
}

function considerFile(dest, file) {
  let path = Path.join(dest, file.relative)

  return fs.readFile(path, 'utf8')
    .then((contents) => {
      let areFilesDifferent = (contents !== String(file.contents))
      return areFilesDifferent && inquireForReplacement(file)
    })
    .catch((err) => {
      if (err.code === 'EISDIR' || err.code === 'ENOENT') {
        return true
      }

      throw new PluginError(
        `Reading a file for comparison failed with: ${err.message}`
      )
    })
}

module.exports = function conflict(dest, options = {}) {
  if (!dest) {
    throw new PluginError('Missing the destination dir parameter')
  }

  let { replaceAll, skipAll } = options
  let actions = {
    end: () => process.exit(0),
    skip: () => false,
    replace: () => true,
    skipAll: () => {
      skipAll = true
      return false
    },
    replaceAll: () => {
      replaceAll = true
      return true
    },
  }

  return through2.obj((file, enc, cb) => {
    if (skipAll) {
      return cb()
    }

    if (replaceAll) {
      return cb(null, file)
    }

    considerFile(dest, file)
      .then((action) => {
        return (actions[action]) ? actions[action]() : action
      })
      .then(
        (addFile) => {
          addFile ? cb(null, file) : cb()
        },
        cb
      )
  })
}
