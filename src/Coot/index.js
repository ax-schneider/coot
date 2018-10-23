const { resolvePath } = require('../utils/common')
const ConfigManager = require('../ConfigManager')
const TemplateManager = require('../TemplateManager')


class Coot {
  static load(path) {
    return new Promise((resolve) => {
      let coot = new this()
      resolve(coot.init(path))
    })
  }

  init(path) {
    path = resolvePath(path)
    return ConfigManager.load(path)
      .then((configManager) => {
        this.configManager = configManager
        this.configPath = configManager.path
        this.templateManager = new TemplateManager(this.getConfig())
        return this
      })
  }

  getConfig() {
    return this.configManager.getCompiled()
  }

  parseTemplateId(id) {
    return this.templateManager.parseTemplateId(id)
  }

  resolveTemplateId(id) {
    return this.templateManager.resolveTemplateId(id)
  }

  loadTemplate(id) {
    return this.templateManager.loadTemplate(id)
  }

  isTemplateSaved(name) {
    return this.templateManager.isTemplateSaved(name)
  }

  getSavedTemplates() {
    return this.templateManager.getSavedTemplates()
  }

  saveTemplate(id, name) {
    return this.templateManager.saveTemplate(id, name)
  }
}


module.exports = Coot
