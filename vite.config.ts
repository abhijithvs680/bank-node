import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base:"./",
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        // Set fixed file names for entry and assets
        entryFileNames: 'assets/index-[name][hash].js',         // No hash in filename
        chunkFileNames: 'assets/index-[name][hash].js',         // For code splitting
        assetFileNames: 'assets/index-[name][hash].[ext]',      // For CSS, images, fonts
      }
    }
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  worker: {
    format: 'es'
  }
}));
