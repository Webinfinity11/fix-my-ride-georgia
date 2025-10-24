import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React dependencies
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-core';
          }
          if (id.includes('node_modules/react-router-dom')) {
            return 'react-router';
          }
          
          // Heavy mapping libraries - lazy loaded per route
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) {
            return 'map-vendor';
          }
          
          // Date picker - lazy loaded in booking
          if (id.includes('node_modules/react-day-picker') || id.includes('node_modules/date-fns')) {
            return 'date-picker';
          }
          
          // Form validation - lazy loaded per form
          if (id.includes('node_modules/zod')) {
            return 'zod-vendor';
          }
          if (id.includes('node_modules/react-hook-form')) {
            return 'form-vendor';
          }
          
          // Supabase
          if (id.includes('node_modules/@supabase')) {
            return 'supabase-vendor';
          }
          
          // React Query
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'query-vendor';
          }
          
          // UI Components - split by type
          if (id.includes('node_modules/@radix-ui')) {
            if (id.includes('dialog') || id.includes('alert-dialog')) {
              return 'ui-dialogs';
            }
            if (id.includes('dropdown') || id.includes('select') || id.includes('popover')) {
              return 'ui-menus';
            }
            return 'ui-vendor';
          }
          
          // Charts - only loaded on dashboard
          if (id.includes('node_modules/recharts')) {
            return 'charts-vendor';
          }
          
          // Other vendor code
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/service-pin.png', 'fixup-logo.jpg'],
      manifest: {
        name: 'FixUp - ავტოსერვისების პლატფორმა',
        short_name: 'FixUp',
        description: 'პლატფორმა, რომელიც აკავშირებს ავტომობილის ხელოსნებს და მომხმარებლებს',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/service-pin.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/service-pin.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB limit
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/kwozniwtygkdoagjegom\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          },
          {
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
