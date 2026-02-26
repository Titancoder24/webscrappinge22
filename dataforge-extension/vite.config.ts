import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, readdirSync, writeFileSync, readFileSync } from 'fs';

/**
 * Chrome Extension Manifest V3 build.
 *
 * Content scripts and service workers cannot use ES module imports when
 * injected via manifest.json content_scripts[].js / background.service_worker.
 * We solve this by emitting IIFE bundles for background & content, and a
 * normal ESM side-panel page.
 *
 * Strategy: single Rollup build with `inlineDynamicImports: false` and
 * `manualChunks` that force all code used by background and content to be
 * inlined into their respective entry chunks (no shared chunks).
 */
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-extension-files',
      writeBundle() {
        const distDir = resolve(__dirname, 'dist');

        // Copy manifest.json to dist
        copyFileSync(
          resolve(__dirname, 'manifest.json'),
          resolve(distDir, 'manifest.json'),
        );

        // Create an empty content-styles.css if not emitted
        const cssPath = resolve(distDir, 'content-styles.css');
        if (!existsSync(cssPath)) {
          // Read the overlay CSS and write it out
          const srcCss = resolve(__dirname, 'src/content/overlay/styles.css');
          if (existsSync(srcCss)) {
            copyFileSync(srcCss, cssPath);
          } else {
            writeFileSync(cssPath, '/* DataForge content styles */\n');
          }
        }

        // Copy icons directory to dist
        const iconsDistDir = resolve(distDir, 'icons');
        if (!existsSync(iconsDistDir)) {
          mkdirSync(iconsDistDir, { recursive: true });
        }
        const srcIcons = resolve(__dirname, 'public/icons');
        if (existsSync(srcIcons)) {
          for (const file of readdirSync(srcIcons)) {
            copyFileSync(resolve(srcIcons, file), resolve(iconsDistDir, file));
          }
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'sidepanel.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
      },
      output: {
        format: 'es',
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') return 'background.js';
          if (chunkInfo.name === 'content') return 'content.js';
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        // Force all shared modules to be inlined into each entry point.
        // This duplicates a tiny amount of code (~700 bytes for id.ts) but
        // ensures background.js and content.js are fully self-contained.
        manualChunks: () => undefined,
      },
    },
    target: 'esnext',
    minify: false,
    sourcemap: false,
    cssCodeSplit: false,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
});
