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
        copyFileSync('crates/wasm/pkg/wasm_bg.wasm', 'dist/assets/wasm_bg.wasm')
        copyFileSync('crates/wasm/pkg/wasm.js', 'dist/assets/wasm.js')
      }
    }
  ],
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.ts']
  }
})
