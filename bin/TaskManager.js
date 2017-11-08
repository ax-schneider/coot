const { existsSync } = require('fs')
const { resolvePath } = require('../lib/utils')
const CliTask = require('./CliTask')


class TaskManager {
  constructor(tasksPath) {
    this.tasksPath = tasksPath
  }

  loadTask(name) {
    return new Promise((resolve) => {
      let { tasksPath } = this
      let path = resolvePath(tasksPath, name)

      if (!existsSync(path)) {
        throw new Error(`Task "${name}" does not exist in ${tasksPath}`)
      }

      let task = CliTask.load(path)
      return resolve(task)
    })
  }
}


module.exports = TaskManager
