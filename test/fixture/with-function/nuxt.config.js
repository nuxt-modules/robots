export default {
  rootDir: __dirname,
  modules: [
    ['../../../src/module.ts', () => ({
      UserAgent: 'Googlebot',
      Disallow: () => '/'
    })]
  ]
}
