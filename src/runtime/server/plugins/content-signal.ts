import { getResponseHeader, setHeader } from '#nuxtseo/h3'
import { defineNitroPlugin } from '#nuxtseo/nitro'
import { useRuntimeConfigNuxtRobots } from '../composables/useRuntimeConfigNuxtRobots'

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('beforeResponse', (event) => {
    const { contentSignalHeader } = useRuntimeConfigNuxtRobots(event)
    if (contentSignalHeader && getResponseHeader(event, 'content-signal') === undefined)
      setHeader(event, 'Content-Signal', contentSignalHeader)
  })
})
