import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    {
      name: 'fix-slidev-windows-paths',
      resolveId(source) {
        // Slidev v52 génère des chemins cassés sur Windows :
        // "../Users/nicol/.../C:/Users/nicol/.../style.css"
        // On extrait la partie Windows absolue et on la retourne directement.
        const match = source.match(/([A-Z]:\/[^"]+)$/i)
        if (match && match[1] !== source) {
          return path.resolve(match[1])
        }
      },
    },
  ],
})
