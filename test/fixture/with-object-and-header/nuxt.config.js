export default {
  rootDir: __dirname,
  modules: [
    '../../../src/module.ts'
  ],
  robots: {
    Header: 'Comment',
    UserAgent: 'Googlebot',
    Disallow: () => '/'
  }
}
