const Path = require('path')
const through2 = require('through2')
const tmpl = require('lodash.template')


module.exports = function template(options, data) {
  return through2.obj((file, enc, cb) => {
    if (file.isNull()) {
      return cb()
    }

    let { base, path, contents } = file
    let relativePath = Path.relative(base, path)

    relativePath = tmpl(relativePath, options)(data)
    contents = tmpl(contents.toString(), options)(data)

    file.path = Path.join(file.base, relativePath)
    file.contents = new Buffer(contents)

    cb(null, file)
  })
}
