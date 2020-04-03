module.exports = {
  rootDir: __dirname,
  modules: [
    {
      handler: require('../../../lib/module'),
      options: () => {
        return {
          UserAgent: 'Googlebot',
          Disallow: () => '/'
        }
      }
    }
  ]
}
