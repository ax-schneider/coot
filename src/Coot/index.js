const { resolvePath } = require('../utils/common')
const ConfigManager = require('../ConfigManager')
const TemplateManager = require('../TemplateManager')


class Coot {
  static load(path) {
    return new Promise((resolve) => {
      let coot = new this(path)
      resolve(coot.init())
    })
  }

  constructor(path) {
    this.path = resolvePath(path)
  }

  init() {
    return ConfigManager.load(this.path)
      .then((configManager) => {
        this.configManager = configManager
        this.templateManager = new TemplateManager(this.getConfig())
        return this
      })
  }

  getConfig() {
    return this.configManager.getCompiled()
  }

  loadTemplate(id) {
    return this.templateManager.loadTemplate(id)
  }

  isTemplateInstalled(name) {
    return this.templateManager.isTemplateInstalled(name)
  }

  getInstalledTemplates() {
    return this.templateManager.getInstalledTemplates()
  }

  installTemplate(id, name) {
    return this.templateManager.installTemplate(id, name)
  }
}


module.exports = Coot
