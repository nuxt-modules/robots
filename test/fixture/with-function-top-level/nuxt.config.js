export default {
  rootDir: __dirname,
  modules: [
    '../../../src/module.ts'
  ],
  robots: () => {
    return {
      UserAgent: 'Googlebot',
      Disallow: () => '/'
    }
  }
}
