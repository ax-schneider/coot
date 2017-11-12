const { Transform } = require('stream')
const vfs = require('vinyl-fs')
const Task = require('./Task')


function srcHandler(_, options) {
  let { src, files } = options

  if (files && files.length) {
    return vfs.src(files, { cwd: src })
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
  static resolveConfig(config) {
    config = super.resolveConfig(config)

    let { files, options } = config

    if (files && !Array.isArray(files)) {
      files = [files]
    } else if (!files) {
      files = []
    }

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
      coerce: (value) => {
        return value ? files.concat(value) : files
      },
    }

    return config
  }

  constructor(config) {
    super(config)

    this.command.lifecycle.hook({
      event: 'handle',
      tags: ['handleCommand'],
      goesBefore: ['handleCommand'],
    }, this._makeHandler(srcHandler))

    this.command.lifecycle.hook({
      event: 'handle',
      tags: ['handleCommand'],
      goesAfter: ['handleCommand'],
    }, this._makeHandler(destHandler))
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


module.exports = FileTask
