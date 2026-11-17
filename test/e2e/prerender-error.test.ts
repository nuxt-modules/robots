import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createResolver } from '@nuxt/kit'
import { setup, useTestContext } from '@nuxt/test-utils'
import { Window } from 'happy-dom'
import { describe, expect, it } from 'vitest'

const { resolve } = createResolver(import.meta.url)

for (const scenario of [
  { name: 'rendered error page', prerenderErrorPages: true, ssr: true, errorRobots: '' },
  { name: 'custom error metadata', prerenderErrorPages: true, ssr: true, errorRobots: 'index, follow' },
  { name: 'custom disabled value', prerenderErrorPages: true, ssr: true, errorRobots: 'noindex', disabledValue: 'noindex, nofollow, noarchive' },
  { name: 'legacy fallback', prerenderErrorPages: false, ssr: true, errorRobots: '' },
  { name: 'SPA fallback', prerenderErrorPages: true, ssr: false, errorRobots: '' },
]) {
  describe(scenario.name, async () => {
    await setup({
      rootDir: resolve('../fixtures/prerender-error'),
      build: true,
      dev: false,
      server: false,
      nuxtConfig: {
        nitro: { static: true },
        ssr: scenario.ssr,
        experimental: { prerenderErrorPages: scenario.prerenderErrorPages },
        robots: { robotsDisabledValue: scenario.disabledValue ?? 'noindex, nofollow' },
        runtimeConfig: { public: { errorRobots: scenario.errorRobots } },
      },
    })

    it('emits one disabled robots directive on the generated 404 page', async () => {
      const ctx = useTestContext()
      const html = await readFile(join(ctx.nuxt!.options.nitro.output!.dir!, 'public/404.html'), 'utf8')
      const window = new Window({ settings: { enableJavaScriptEvaluation: false, disableJavaScriptFileLoading: true, disableCSSFileLoading: true } })
      try {
        const page = window.document.createElement('template')
        page.innerHTML = html
        expect(Array.from(page.content.querySelectorAll('meta[name="robots"]'), tag => tag.getAttribute('content')))
          .toEqual([scenario.disabledValue ?? 'noindex, nofollow'])
        if (scenario.ssr && scenario.prerenderErrorPages)
          expect(page.content.querySelector('h1')?.textContent).toBe('404')
      }
      finally {
        await window.happyDOM.close()
      }
    })

    it.each(['index.html', '200.html'])('keeps %s indexable with one robots tag', async (path) => {
      const ctx = useTestContext()
      // eslint-disable-next-line harlanzw/no-test-file-reads -- Parse generated HTML output, not source files.
      const html = await readFile(join(ctx.nuxt!.options.nitro.output!.dir!, 'public', path), 'utf8')
      const window = new Window({ settings: { enableJavaScriptEvaluation: false, disableJavaScriptFileLoading: true, disableCSSFileLoading: true } })
      try {
        const page = window.document.createElement('template')
        page.innerHTML = html
        expect(Array.from(page.content.querySelectorAll('meta[name="robots"]'), tag => tag.getAttribute('content')))
          .toEqual(['index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'])
      }
      finally {
        await window.happyDOM.close()
      }
    })
  })
}
