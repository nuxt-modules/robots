module.exports = {
  rootDir: __dirname,
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
