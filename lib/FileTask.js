const { Transform } = require('stream')
const vfs = require('vinyl-fs')
const Task = require('./Task')


function srcHandler(_, options, taskConfig) {
  let { src, files } = options
  files = files || []

  if (taskConfig.files) {
    files = taskConfig.files.concat(files)
  }

  if (files.length) {
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

    config.options.src = {
      description: 'Source path',
      type: 'path',
      defaultValue: '.',
    }

    config.options.dest = {
      description: 'Destination path',
      type: 'path',
      defaultValue: '.',
    }

    config.options.files = {
      description: 'Files to process',
      defaultValue: null,
      type: null,
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
