/**
 * DataForge Extension Build Script
 *
 * Chrome Extension Manifest V3 requirements:
 * - Background service worker: single JS file (supports ES module with "type":"module")
 * - Content scripts: single IIFE JS file (NO ES module imports allowed)
 * - Side panel: normal web page (ESM fine)
 *
 * This script runs 3 Vite builds:
 * 1. Side panel (ESM, with React, CSS)
 * 2. Background service worker (IIFE, no DOM)
 * 3. Content script (IIFE, DOM access, no React)
 *
 * Then copies manifest.json, icons, and content CSS to dist/.
 */

import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { copyFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist');

// Clean dist
if (existsSync(DIST)) {
  rmSync(DIST, { recursive: true });
}
mkdirSync(DIST, { recursive: true });

console.log('🔨 Building DataForge Extension...\n');

// ─── Build 1: Side Panel (ESM + React + Tailwind) ───────────────────────
console.log('📦 [1/3] Building side panel...');
await build({
  configFile: false,
  root: ROOT,
  base: '',
  plugins: [react()],
  resolve: {
    alias: { '@': resolve(ROOT, 'src') },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        sidepanel: resolve(ROOT, 'sidepanel.html'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    target: 'esnext',
    minify: false,
    sourcemap: false,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  logLevel: 'warn',
});

// ─── Build 2: Background Service Worker (IIFE) ──────────────────────────
console.log('📦 [2/3] Building background service worker...');
await build({
  configFile: false,
  root: ROOT,
  plugins: [],
  resolve: {
    alias: { '@': resolve(ROOT, 'src') },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: resolve(ROOT, 'src/background/index.ts'),
      name: 'DataForgeBackground',
      formats: ['iife'],
      fileName: () => 'background.js',
    },
    target: 'esnext',
    minify: false,
    sourcemap: false,
    copyPublicDir: false,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  logLevel: 'warn',
});

// ─── Build 3: Content Script (IIFE) ─────────────────────────────────────
console.log('📦 [3/3] Building content script...');
await build({
  configFile: false,
  root: ROOT,
  plugins: [],
  resolve: {
    alias: { '@': resolve(ROOT, 'src') },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: resolve(ROOT, 'src/content/index.ts'),
      name: 'DataForgeContent',
      formats: ['iife'],
      fileName: () => 'content.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'content-styles.css';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    target: 'esnext',
    minify: false,
    sourcemap: false,
    copyPublicDir: false,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  logLevel: 'warn',
});

// ─── Copy static files ──────────────────────────────────────────────────
console.log('📋 Copying manifest.json and icons...');

// manifest.json
copyFileSync(
  resolve(ROOT, 'manifest.json'),
  resolve(DIST, 'manifest.json'),
);

// Copy content overlay CSS (in case not emitted by the build)
const contentCssPath = resolve(DIST, 'content-styles.css');
if (!existsSync(contentCssPath)) {
  const srcCss = resolve(ROOT, 'src/content/overlay/styles.css');
  if (existsSync(srcCss)) {
    copyFileSync(srcCss, contentCssPath);
  }
}

// Icons
const iconsDistDir = resolve(DIST, 'icons');
if (!existsSync(iconsDistDir)) {
  mkdirSync(iconsDistDir, { recursive: true });
}
const srcIcons = resolve(ROOT, 'public/icons');
if (existsSync(srcIcons)) {
  for (const file of readdirSync(srcIcons)) {
    copyFileSync(resolve(srcIcons, file), resolve(iconsDistDir, file));
  }
}

console.log('\n✅ Build complete! Extension is in dist/');
console.log('   Load it in Chrome: chrome://extensions → Load unpacked → select dist/');
