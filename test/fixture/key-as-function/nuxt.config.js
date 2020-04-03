module.exports = {
  rootDir: __dirname,
  modules: [
    { handler: require('../../../') }
  ],
  robots: [
    {
      UserAgent: () => ['Googlebot', 'Bingbot'],
      Disallow: '/admin'
    }
  ]
}
