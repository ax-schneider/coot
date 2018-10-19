/* eslint-disable no-console */

const CootCommand = require('./commands/Coot')
const Coot = require('./Coot')


console.log()
Coot.load(process.cwd())
  .then((coot) => {
    return CootCommand.create(coot)
  })
  .then((command) => {
    return command.run(null, ...process.argv.slice(2))
  })
  .then(() => {}, (err) => err)
  .then((result) => {
    if (result) {
      console.error(result)
    }

    console.log()
    let code = Number(Boolean(result))
    process.exit(code)
  })
