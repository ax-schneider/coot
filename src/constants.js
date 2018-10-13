const { resolvePath } = require('./utils/common')


const COOT_DIR = resolvePath('~/.coot')
const GLOBAL_CONFIG_PATH = resolvePath(COOT_DIR, 'config.json')


module.exports = { COOT_DIR, GLOBAL_CONFIG_PATH }
