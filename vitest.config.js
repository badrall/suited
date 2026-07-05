import { defineConfig } from 'vitest/config'

// Tests unitaires purs (pas de DOM nécessaire : logique de tirage et de répétition espacée).
export default defineConfig({
  test: {
    environment: 'node',
  },
})
