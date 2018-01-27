const { preHook } = require('comanche/effects')
const modifySchema = require('./modifySchema')
const inquire = require('./inquire')


function schematizeHandler(schema) {
  schema = modifySchema(schema)
  return [schema]
}

function* executeHandler(config, batch) {
  let newBatch = []

  for (let i = 0; i < batch.length; i++) {
    newBatch[i] = yield* inquire(config, batch[i])
  }

  return [config, newBatch]
}


module.exports = function* inquire() {
  yield preHook('schematize', schematizeHandler)

  yield preHook({
    event: 'execute',
    tags: ['addOption'],
    goesAfter: ['identifyCommand'],
    goesBefore: ['addOption'],
  }, executeHandler)
}
