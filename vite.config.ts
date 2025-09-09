/// <reference types="vitest" />
import { defineConfig } from 'vite'
import { copyFileSync, mkdirSync } from 'fs'

export default defineConfig({
  assetsInclude: ['**/*.wasm'],
  plugins: [
    {
      name: 'copy-wasm-files',
      writeBundle() {
        mkdirSync('dist/assets', { recursive: true })
        copyFileSync('crates/sph/pkg/sph_bg.wasm', 'dist/assets/sph_bg.wasm')
        copyFileSync('crates/sph/pkg/sph.js', 'dist/assets/sph.js')
      }
    }
  ],
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.ts']
  }
})
