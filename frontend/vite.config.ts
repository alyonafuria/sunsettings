import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
      },
    }),
  ],
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          mapbox: ['mapbox-gl'],
          wallets: [
            '@txnlab/use-wallet',
            '@txnlab/use-wallet-react',
            '@perawallet/connect',
            '@blockshake/defly-connect',
          ],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['algosdk'],
  },
})
