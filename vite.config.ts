import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'rollup'

// Conditionally add visualizer when VIZ=1
const maybeVisualizer = async (): Promise<Plugin | null> => {
  if (process.env.VIZ !== '1') return null;
  const { visualizer } = await import('rollup-plugin-visualizer');
  return visualizer({ filename: 'dist/stats.html', open: false });
};

// https://vite.dev/config/
export default defineConfig(async () => {
  const viz = await maybeVisualizer();
  const plugins: Plugin[] = [react() as unknown as Plugin];
  if (viz) plugins.push(viz as Plugin);

  return {
    plugins,
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        // Remove the restrictive COEP header that blocks Firebase
        // 'Cross-Origin-Embedder-Policy': 'require-corp' // This was blocking Firebase popups
      },
      cors: true
    },
    preview: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        // Remove the restrictive COEP header that blocks Firebase
        // 'Cross-Origin-Embedder-Policy': 'require-corp' // This was blocking Firebase popups
      },
      cors: true
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              // Split Firebase by sub-package
              if (id.includes('firebase')) {
                if (/[\\/]firebase[\\/]auth/.test(id)) return 'vendor-firebase-auth';
                if (/[\\/]firebase[\\/]firestore/.test(id)) return 'vendor-firebase-firestore';
                if (/[\\/]firebase[\\/]storage/.test(id)) return 'vendor-firebase-storage';
                if (/[\\/]firebase[\\/]analytics/.test(id)) return 'vendor-firebase-analytics';
                if (/[\\/]firebase[\\/]app/.test(id)) return 'vendor-firebase-app';
                return 'vendor-firebase';
              }
              // Other major vendors
              if (/[\\/]@tanstack[\\/]/.test(id)) return 'vendor-react-query';
              if (/[\\/]react-router[\\/]/.test(id)) return 'vendor-router';
              if (/[\\/]react[\\/]/.test(id)) return 'vendor-react';
              if (/[\\/]zustand[\\/]/.test(id)) return 'vendor-zustand';
              if (/[\\/]axios[\\/]/.test(id)) return 'vendor-axios';
              if (/[\\/]react-firebase-hooks[\\/]/.test(id)) return 'vendor-react-firebase-hooks';
              return 'vendor';
            }
          }
        }
      }
    }
  };
});
