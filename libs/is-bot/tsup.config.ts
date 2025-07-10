import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/drivers/h3.ts', 
    'src/behaviors/index.ts'
  ],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  external: ['h3', 'unstorage']
})