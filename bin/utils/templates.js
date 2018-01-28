const vfs = require('vinyl-fs')
const template = require('../vinylPlugins/template')


const TEMPLATE_OPTIONS = {
  variable: 'o',
}
const PROXY_TRAPS = {
  get(target, prop) {
    if (!target.includes(prop)) {
      target.push(prop)
    }
  },
}


function interpolateFileStream(fileStream, options) {
  return fileStream.pipe(template(TEMPLATE_OPTIONS, options))
}

function getOptionsFromTemplates(cwd, files) {
  return new Promise((resolve, reject) => {
    let optionNames = []
    let optionsProxy = new Proxy(optionNames, PROXY_TRAPS)
    let stream = vfs.src(files, { cwd, dot: true })

    interpolateFileStream(stream, optionsProxy)
      .on('data', () => {})
      .on('end', () => resolve(optionNames))
      .on('error', reject)
  })
}


module.exports = { getOptionsFromTemplates, interpolateFileStream }
