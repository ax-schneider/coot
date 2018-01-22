const { Transform } = require('stream')
const vfs = require('vinyl-fs')
const Task = require('./Task')


function srcHandler(_, options) {
  let { src, files } = options

  if (files && files.length) {
    return vfs.src(files, { cwd: src, dot: true })
  } else {
    return new Transform()
  }
}

function destHandler(files, options) {
  return new Promise((resolve, reject) => {
    files.pipe(vfs.dest(options.dest))
      .on('end', resolve)
      .on('error', reject)
  })
}


class FileTask extends Task {
  static normalizeConfig(config) {
    config = super.normalizeConfig(config)
    let { files, options } = config
    files = files || []

    options.src = {
      description: 'Source path',
      type: 'path',
      defaultValue: '.',
    }

    options.dest = {
      description: 'Destination path',
      type: 'path',
      defaultValue: '.',
    }

    options.files = {
      description: 'Files to process',
      defaultValue: null,
      type: null,
      coerce: (value) => {
        return value ? files.concat(value) : files
      },
    }

    return config
  }

  _makeHandlerArgs(command, result) {
    if (Array.isArray(result)) {
      return result.slice()
    }

    let args = super._makeHandlerArgs(command)
    args.unshift(result)
    return args
  }
}

FileTask.startHandlers = Task.startHandlers.concat(srcHandler)
FileTask.endHandlers = Task.endHandlers.concat(destHandler)


module.exports = FileTask
