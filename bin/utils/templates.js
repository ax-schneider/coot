const vfs = require('vinyl-fs')
const template = require('lodash/template')
const change = require('gulp-change')
const rename = require('gulp-simple-rename')


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
  return fileStream
    .pipe(change((contents) => template(contents, TEMPLATE_OPTIONS)(options)))
    .pipe(rename((path) => template(path, TEMPLATE_OPTIONS)(options)))
}

function getOptionsFromTemplates(cwd, files) {
  return new Promise((resolve, reject) => {
    let optionNames = []
    let optionsProxy = new Proxy(optionNames, PROXY_TRAPS)
    let stream = vfs.src(files, { cwd, dot: true })

    interpolateFileStream(stream, optionsProxy)
      .on('close', () => resolve(optionNames))
      .on('error', reject)
  })
}


module.exports = { getOptionsFromTemplates, interpolateFileStream }
