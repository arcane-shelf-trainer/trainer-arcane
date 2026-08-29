/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  // Les 400 couvertures restent des fichiers separes plutot que d etre incrustees.
  build: { assetsInlineLimit: 0 },
  test: { environment: 'node' },
})
