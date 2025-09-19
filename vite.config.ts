import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks for better caching
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('react-router')) {
              return 'router';
            }
            if (id.includes('react-syntax-highlighter')) {
              return 'syntax-highlighter';
            }
            if (id.includes('prism') || id.includes('highlight.js')) {
              return 'syntax-highlighter';
            }
            if (id.includes('papaparse')) {
              return 'csv-parser';
            }
            if (id.includes('ajv')) {
              return 'validation';
            }
            if (id.includes('file-saver') || id.includes('react-dropzone')) {
              return 'file-utils';
            }
            if (id.includes('tailwindcss')) {
              return 'styles';
            }
            // Group other vendor dependencies
            return 'vendor';
          }
          
          // Split large application components
          if (id.includes('/src/components/json-generator/')) {
            return 'json-generator';
          }
          if (id.includes('/src/components/json-validator/')) {
            return 'json-validator';
          }
          if (id.includes('/src/components/csv-converter/')) {
            return 'csv-converter';
          }
          if (id.includes('/src/components/common/')) {
            return 'common-ui';
          }
          if (id.includes('/src/utils/')) {
            return 'app-utils';
          }
        }
      }
    },
    // Stricter chunk size limit for better performance
    chunkSizeWarningLimit: 400,
    // Enable source maps but smaller ones
    sourcemap: true,
    // Modern browser target for smaller bundles
    target: 'esnext',
    // Better minification (using esbuild default)
    minify: true
  },
  // Performance optimizations
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      'ajv',
      'papaparse'
    ]
  },
  // Enable CSS code splitting
  css: {
    devSourcemap: true
  }
})
