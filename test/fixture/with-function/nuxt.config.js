module.exports = {
  rootDir: __dirname,
  render: {
    resourceHints: false
  },
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
