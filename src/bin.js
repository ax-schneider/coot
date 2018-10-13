/* eslint-disable no-console */

const CootCommand = require('./commands/Coot')
const Coot = require('./Coot')


Coot.load(process.cwd())
  .then((coot) => {
    return CootCommand.create(coot)
  })
  .then((command) => {
    return command.run(null, ...process.argv.slice(2))
  })
  .catch(console.error)
