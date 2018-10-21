/* eslint-disable no-console */

const CootCommand = require('./commands/Coot')


console.log()
CootCommand.create()
  .then((command) => {
    return command.run({ cwd: process.cwd() }, ...process.argv.slice(2))
  })
  // Return the error to pass it to the next then() as a result
  .then(() => {}, (err) => err)
  .then((result) => {
    if (result) {
      console.error(result)
    }

    console.log()
    let code = Number(Boolean(result))
    process.exit(code)
  })
