# DataForge — Universal Web Scraper Chrome Extension

The most powerful, fully client-side web scraper Chrome extension. No servers, no APIs, no accounts, no limits.

## Install in Chrome (3 steps)

1. **Download** — Click the green `Code` button above → `Download ZIP` → Unzip it
2. **Open Chrome Extensions** — Go to `chrome://extensions/` → Enable **Developer mode** (top right toggle)
3. **Load Extension** — Click **Load unpacked** → Select the unzipped folder (the one with `manifest.json`)

That's it! Click the DataForge icon in your toolbar to open the side panel.

## Features

| Module | Description |
|--------|-------------|
| **List Extractor** | Smart detection of repeating data (products, reviews, listings) with one-click extraction |
| **Page Extractor** | Bulk extract from multiple URLs |
| **Email Extractor** | Find emails on any page (regex + mailto + obfuscation detection) |
| **Image Downloader** | Detect and bulk download all images |
| **Text Extractor** | Clean article text extraction (title, author, date, content) |
| **Data Table** | Built-in spreadsheet with sort, filter, search, inline edit |

## Export Formats

- CSV
- JSON
- Excel (XLSX) — custom lightweight writer, no external libraries
- Clipboard (TSV)

## 5 Narrow AI Engines (100% Client-Side)

All intelligence runs locally in your browser. No external APIs. No LLMs. No cloud.

| Engine | What It Does |
|--------|-------------|
| **PatternSense** | Detects repeating DOM patterns via heuristic scoring |
| **SelectorForge** | Generates optimal CSS selectors (6 strategies, scored) |
| **PageSense** | Detects pagination (next buttons, URL patterns, infinite scroll, load more) |
| **TypeSense** | Classifies fields (price, email, URL, date, rating, phone, etc.) |
| **CleanSense** | Auto-cleans data (whitespace, Unicode, URLs, dedup) |

## Tech Stack

- **Pure vanilla JavaScript** — no React, no frameworks, no npm, no build step
- **Manifest V3** Chrome Extension
- **Zero external dependencies** — everything is self-contained
- **335KB total** — well under Chrome's 20MB limit
- **Emerald + Violet** dark theme with premium animations

## Privacy

All data stays in your browser. Nothing is ever sent to any server. Uses `chrome.storage.local` and IndexedDB for persistence.

## File Structure

```
manifest.json          ← Chrome reads this first
background.js          ← Service worker
content/               ← Content scripts (injected into web pages)
  engines/             ← 5 AI engines
  content.js           ← Main orchestrator
  styles.css           ← Page overlay styles
sidepanel/             ← Side panel UI
  index.html           ← Entry point
  styles.css           ← Emerald+Violet theme
  animations.css       ← Micro-interactions
  store.js             ← State management
  app.js               ← App controller
  components/          ← UI components
icons/                 ← Extension icons
lib/                   ← Export engine, storage utilities
```
