const template = require('lodash.template')
const change = require('gulp-change')
const rename = require('gulp-simple-rename')


module.exports = function templateHandler(files, options) {
  return files
    .pipe(change((contents) => template(contents)(options)))
    .pipe(rename((path) => template(path)(options)))
}
