const { resolve } = require('path')

module.exports = {
  rootDir: resolve(__dirname, '..'),
  buildDir: resolve(__dirname, '.nuxt'),
  srcDir: __dirname,
  render: {
    resourceHints: false
  },
  modules: ['@@'],
  babel: {
    presets: [
      'es2015',
      'stage-0'
    ],
    plugins: [
      'transform-runtime'
    ]
  }
}
