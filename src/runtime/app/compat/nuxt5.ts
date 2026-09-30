import { useResponseHeader } from 'nuxt/app'

export { injectHead, useHead } from 'nuxt/app'

export function useRobotsHeader() {
  const header = useResponseHeader('X-Robots-Tag')
  return (value: string) => {
    header.value = value
  }
}
