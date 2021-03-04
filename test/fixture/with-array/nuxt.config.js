export default {
  rootDir: __dirname,
  modules: [
    '../../../src/module.ts'
  ],
  robots: [
    {
      UserAgent: ['Googlebot', () => 'Bingbot'],
      Disallow: '/admin'
    }
  ]
}
