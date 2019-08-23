module.exports = {
  rootDir: __dirname,
  render: {
    resourceHints: false
  },
  modules: [
    { handler: require('../../../lib/module') }
  ],
  robots: () => {
    return {
      UserAgent: 'Googlebot',
      Disallow: () => '/'
    }
  }
}
