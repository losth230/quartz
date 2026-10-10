import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' → le build fonctionne partout : GitHub Pages (sous-chemin
// /Chasse-et-Peche/), racine de domaine, ou serveur local de dev.
export default defineConfig({
  plugins: [react()],
  base: './',
})
