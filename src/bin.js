const CootCommand = require('./commands/Coot')

// eslint-disable-next-line no-console
console.log()
CootCommand.create()
  .then((command) => {
    let options = { cwd: process.cwd() }
    let args = process.argv.slice(2)
    return command.run(options, ...args)
  })
  // Return the error to pass it to the next then() as a result
  .then(() => {}, (err) => err)
  .then((result) => {
    if (result) {
      // eslint-disable-next-line no-console
      console.error(result)
    }

    // eslint-disable-next-line no-console
    console.log()
    let code = Number(Boolean(result))
    process.exit(code)
  })
