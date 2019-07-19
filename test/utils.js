const { Nuxt, Builder, Generator } = require('nuxt-edge')
const request = require('request-promise-native')
const getPort = require('get-port')

let port

const url = path => `http://localhost:${port}${path}`
const get = path => request(url(path))
const loadFixture = fixture => require(`./fixture/${fixture}/nuxt.config`)

const setupNuxt = async (config) => {
  const nuxt = new Nuxt(config)
  await nuxt.ready()
  await new Builder(nuxt).build()
  port = await getPort()
  await nuxt.listen(port)

  return nuxt
}

const generateNuxt = async (config) => {
  const nuxt = new Nuxt(config)
  await nuxt.ready()

  const builder = new Builder(nuxt)
  const generator = new Generator(nuxt, builder)
  await generator.generate()

  return nuxt
}

module.exports = {
  setupNuxt,
  generateNuxt,
  loadFixture,
  url,
  get
}
