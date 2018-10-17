/* eslint-disable camelcase */

const Path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')


const ENTRY_PATH = Path.join(__dirname, 'src', 'bin.js')
const OUTPUT_DIR = Path.join(__dirname, 'dist')
const OUTPUT_FILE = 'bin.js'


module.exports = {
  entry: ENTRY_PATH,
  output: {
    filename: OUTPUT_FILE,
    path: OUTPUT_DIR,
    // Replace the "webpack:" prefix in source maps for correct file paths
    devtoolModuleFilenameTemplate: '../[resource-path]?[loaders]',
  },
  target: 'node',
  devtool: 'source-map',
  optimization: {
    // Override the default minimizer to pass custom settings to UglifyJS
    minimizer: [
      new TerserPlugin({
        sourceMap: true,
        terserOptions: {
          // Disable messing with function names because it breaks Inquirer
          mangle: {
            keep_fnames: true,
          },
          compress: {
            keep_fnames: true,
          },
        },
      }),
    ],
  },
  performance: {
    hints: false,
  },
  module: {
    rules: [{
      // Add support for source maps to node.js to display correct stack traces
      // WARNING: it adds a significant delay when an uncaught exception occurs
      test: ENTRY_PATH,
      loader: 'webpack-append',
      query: 'require("source-map-support").install();',
    }, {
      // Force is-windows to be loaded as CommonJS because AMD is broken there
      test: require.resolve('is-windows'),
      use: 'imports-loader?define=.',
    }],
  },
  plugins: [
    new CleanWebpackPlugin([OUTPUT_DIR]),
  ],
}
