import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    // 既定はnode環境(高速・依存が少ない)。DOM操作を伴うコンポーネントテストのファイルでは
    // 先頭に `// @vitest-environment jsdom` を書いて個別に上書きする。
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
