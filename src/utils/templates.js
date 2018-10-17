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

function extractOptionsFromTemplates(cwd, files) {
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

function addOptionsToConfig(config, optionNames) {
  config = Object.assign({ options: [] }, config)

  let newOptions = optionNames
    .filter((name) => {
      return !config.options.find((o) => {
        return o.name === name || (o.aliases && o.aliases.includes(name))
      })
    })
    .map((name) => {
      return { name, required: true }
    })

  config.options = config.options.concat(newOptions)
  return config
}

function fillConfigWithTemplateOptions(config, path) {
  return extractOptionsFromTemplates(path, config.files)
    .then((optionNames) => {
      return addOptionsToConfig(config, optionNames)
    })
}


module.exports = {
  interpolateFileStream, extractOptionsFromTemplates,
  fillConfigWithTemplateOptions,
}
