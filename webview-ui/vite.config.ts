import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import solidSvg from 'vite-plugin-solid-svg'

export default defineConfig({
  plugins: [solidPlugin(), solidSvg()],
  server: {
    port: 3300,
  },
  build: {
    target: 'esnext',
    // polyfillDynamicImport: false,
    outDir: "build",
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      },
    },
  },
});
