module.exports = {
  rootDir: __dirname,
  render: {
    resourceHints: false
  },
  modules: [
    { handler: require('../../../') }
  ],
  robots: {
    UserAgent: 'Googlebot',
    Disallow: () => '/'
  }
}
