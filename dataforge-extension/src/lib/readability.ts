/**
 * Readability – Page text extraction for DataForge.
 *
 * Mozilla Readability-inspired implementation that extracts the main content
 * from a web page by stripping navigation, headers, footers, ads, and sidebars.
 *
 * Extracts:
 *  - Title, meta description, author, publish date
 *  - Main body text with preserved structure
 *  - Word count, reading time, language
 *
 * Custom implementation – zero external dependencies.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Result of readable content extraction. */
export interface ReadableContent {
  /** Page title (from <title>, og:title, or first <h1>). */
  title: string;
  /** Meta description. */
  description: string;
  /** Author name if detectable. */
  author: string;
  /** Publish date as ISO string if detectable. */
  publishDate: string;
  /** Main body text (cleaned, preserving paragraph structure). */
  body: string;
  /** Total word count of the body. */
  wordCount: number;
  /** Estimated reading time in minutes (based on 238 wpm average). */
  readingTime: number;
  /** Document language (from <html lang=""> or meta). */
  language: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Average adult reading speed in words per minute. */
const READING_WPM = 238;

/** Tags whose entire subtree should be removed. */
const REMOVE_TAGS = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED',
  'APPLET', 'LINK', 'META', 'SVG', 'CANVAS', 'TEMPLATE',
]);

/** Tags that are navigation / boilerplate indicators. */
const NAV_TAGS = new Set([
  'NAV', 'HEADER', 'FOOTER', 'ASIDE', 'MENU', 'MENUITEM',
]);

/** Class/ID substrings that strongly indicate non-content boilerplate. */
const BOILERPLATE_PATTERNS = [
  'sidebar', 'side-bar', 'widget', 'nav', 'menu', 'footer', 'header',
  'breadcrumb', 'ad-', 'advertisement', 'sponsor', 'promo', 'related',
  'social', 'share', 'comment', 'disqus', 'respond', 'reply',
  'popup', 'modal', 'overlay', 'cookie', 'consent', 'newsletter',
  'subscribe', 'signup', 'sign-up', 'pagination', 'pager',
  'toolbar', 'tool-bar', 'search', 'login', 'signin',
];

/** Class/ID substrings that strongly indicate content. */
const CONTENT_PATTERNS = [
  'article', 'content', 'entry', 'post', 'text', 'body',
  'story', 'blog', 'main', 'page',
];

/** Tags that produce block-level breaks in text extraction. */
const BLOCK_TAGS = new Set([
  'P', 'DIV', 'SECTION', 'ARTICLE', 'MAIN', 'BLOCKQUOTE',
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'LI', 'TR', 'DT', 'DD', 'FIGURE', 'FIGCAPTION',
  'PRE', 'ADDRESS', 'DETAILS', 'SUMMARY',
]);

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Get the concatenated class + id string for boilerplate pattern matching.
 */
function getIdentifier(el: Element): string {
  const id = el.id || '';
  const className = el.className && typeof el.className === 'string' ? el.className : '';
  return (id + ' ' + className).toLowerCase();
}

/**
 * Check if an element's class/id matches any boilerplate patterns.
 */
function isBoilerplate(el: Element): boolean {
  const ident = getIdentifier(el);
  if (!ident.trim()) return false;

  for (let i = 0; i < BOILERPLATE_PATTERNS.length; i++) {
    if (ident.includes(BOILERPLATE_PATTERNS[i])) {
      // Check if it also matches content patterns (content wins)
      for (let j = 0; j < CONTENT_PATTERNS.length; j++) {
        if (ident.includes(CONTENT_PATTERNS[j])) return false;
      }
      return true;
    }
  }

  return false;
}

/**
 * Score an element based on content density (text-to-element ratio).
 * Higher scores indicate more likely content containers.
 */
function scoreElement(el: Element): number {
  const text = el.textContent || '';
  const textLength = text.trim().length;
  if (textLength === 0) return 0;

  // Count direct child elements
  const childElements = el.children.length;
  // Compute link density: ratio of text inside <a> tags to total text
  const links = el.querySelectorAll('a');
  let linkTextLength = 0;
  for (let i = 0; i < links.length; i++) {
    linkTextLength += (links[i].textContent || '').trim().length;
  }

  const linkDensity = textLength > 0 ? linkTextLength / textLength : 0;

  // Base score: text length with diminishing returns
  let score = Math.sqrt(textLength);

  // Penalize high link density (nav bars, link lists)
  if (linkDensity > 0.5) {
    score *= 0.2;
  } else if (linkDensity > 0.3) {
    score *= 0.5;
  }

  // Bonus for paragraph-rich content
  const paragraphs = el.querySelectorAll('p');
  score += paragraphs.length * 3;

  // Bonus for content-like identifiers
  const ident = getIdentifier(el);
  for (let i = 0; i < CONTENT_PATTERNS.length; i++) {
    if (ident.includes(CONTENT_PATTERNS[i])) {
      score *= 1.5;
      break;
    }
  }

  // Penalty for few text children relative to element children
  if (childElements > 0 && textLength / childElements < 20) {
    score *= 0.6;
  }

  // Penalty for boilerplate indicators
  if (isBoilerplate(el)) {
    score *= 0.1;
  }

  // Semantic bonus for article/main tags
  const tag = el.tagName;
  if (tag === 'ARTICLE') score *= 2;
  if (tag === 'MAIN') score *= 1.8;
  if (tag === 'SECTION') score *= 1.1;

  return score;
}

/**
 * Find the best content container in the document.
 * Scores candidate elements and returns the highest-scoring one.
 */
function findContentRoot(doc: Document): Element | null {
  // Priority 1: <article> element
  const articles = doc.querySelectorAll('article');
  if (articles.length === 1) {
    return articles[0];
  }

  // Priority 2: <main> element
  const mains = doc.querySelectorAll('main');
  if (mains.length === 1) {
    return mains[0];
  }

  // Priority 3: [role="main"]
  const roleMain = doc.querySelector('[role="main"]');
  if (roleMain) {
    return roleMain;
  }

  // Priority 4: Score all significant container elements
  const candidates: Element[] = [];
  const containers = doc.querySelectorAll('div, section, article, main, td');

  for (let i = 0; i < containers.length; i++) {
    const el = containers[i];
    const text = (el.textContent || '').trim();
    // Skip elements with very little text
    if (text.length < 100) continue;
    // Skip elements that are deeply nested navigation
    if (NAV_TAGS.has(el.tagName)) continue;
    candidates.push(el);
  }

  if (candidates.length === 0) {
    return doc.body || null;
  }

  // Score and pick the best
  let bestElement: Element | null = null;
  let bestScore = -1;

  for (let i = 0; i < candidates.length; i++) {
    const s = scoreElement(candidates[i]);
    if (s > bestScore) {
      bestScore = s;
      bestElement = candidates[i];
    }
  }

  return bestElement;
}

/**
 * Extract clean text from a content element, preserving paragraph structure.
 * Walks text nodes, inserting line breaks at block boundaries.
 */
function extractText(el: Element): string {
  const parts: string[] = [];
  let lastWasBlock = true;

  function walk(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      const trimmed = text.replace(/\s+/g, ' ');
      if (trimmed.trim()) {
        parts.push(trimmed);
        lastWasBlock = false;
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const element = node as Element;
    const tag = element.tagName;

    // Skip entirely
    if (REMOVE_TAGS.has(tag)) return;
    if (isBoilerplate(element)) return;
    if (NAV_TAGS.has(tag) && element !== el) return;

    // Block-level elements insert paragraph breaks
    const isBlock = BLOCK_TAGS.has(tag);
    if (isBlock && !lastWasBlock) {
      parts.push('\n\n');
      lastWasBlock = true;
    }

    // Handle <br> as a line break
    if (tag === 'BR') {
      parts.push('\n');
      return;
    }

    // Recurse into children
    const children = element.childNodes;
    for (let i = 0; i < children.length; i++) {
      walk(children[i]);
    }

    if (isBlock && !lastWasBlock) {
      parts.push('\n\n');
      lastWasBlock = true;
    }
  }

  walk(el);

  // Clean up: collapse multiple newlines, trim
  return parts
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .trim();
}

/**
 * Extract the page title from multiple sources in priority order.
 */
function extractTitle(doc: Document): string {
  // Open Graph title
  const ogTitle = doc.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    const content = ogTitle.getAttribute('content')?.trim();
    if (content) return content;
  }

  // Twitter title
  const twitterTitle = doc.querySelector('meta[name="twitter:title"]');
  if (twitterTitle) {
    const content = twitterTitle.getAttribute('content')?.trim();
    if (content) return content;
  }

  // <title> tag (strip site name suffix like " | SiteName" or " - SiteName")
  if (doc.title) {
    const title = doc.title.trim();
    // Try to strip common suffixes
    const separators = [' | ', ' - ', ' – ', ' — ', ' :: ', ' » '];
    for (const sep of separators) {
      const idx = title.lastIndexOf(sep);
      if (idx > 0 && idx > title.length * 0.3) {
        return title.slice(0, idx).trim();
      }
    }
    return title;
  }

  // First <h1>
  const h1 = doc.querySelector('h1');
  if (h1) {
    const text = (h1.textContent || '').trim();
    if (text) return text;
  }

  return '';
}

/**
 * Extract the meta description.
 */
function extractDescription(doc: Document): string {
  const ogDesc = doc.querySelector('meta[property="og:description"]');
  if (ogDesc) {
    const content = ogDesc.getAttribute('content')?.trim();
    if (content) return content;
  }

  const metaDesc = doc.querySelector('meta[name="description"]');
  if (metaDesc) {
    const content = metaDesc.getAttribute('content')?.trim();
    if (content) return content;
  }

  const twitterDesc = doc.querySelector('meta[name="twitter:description"]');
  if (twitterDesc) {
    const content = twitterDesc.getAttribute('content')?.trim();
    if (content) return content;
  }

  return '';
}

/**
 * Extract the author from meta tags, LD+JSON, or common selectors.
 */
function extractAuthor(doc: Document): string {
  // Meta tag
  const metaAuthor = doc.querySelector('meta[name="author"]');
  if (metaAuthor) {
    const content = metaAuthor.getAttribute('content')?.trim();
    if (content) return content;
  }

  // Open Graph article:author
  const ogAuthor = doc.querySelector('meta[property="article:author"]');
  if (ogAuthor) {
    const content = ogAuthor.getAttribute('content')?.trim();
    if (content) return content;
  }

  // Schema.org LD+JSON
  const ldJsonScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (let i = 0; i < ldJsonScripts.length; i++) {
    try {
      const data = JSON.parse(ldJsonScripts[i].textContent || '');
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item.author) {
          if (typeof item.author === 'string') return item.author;
          if (item.author.name) return item.author.name;
          if (Array.isArray(item.author) && item.author[0]?.name) {
            return item.author[0].name;
          }
        }
      }
    } catch {
      // Invalid JSON – skip
    }
  }

  // Common author selectors
  const authorSelectors = [
    '[rel="author"]',
    '.author-name',
    '.author',
    '.byline',
    '[itemprop="author"]',
    '.post-author',
    '.entry-author',
  ];

  for (const selector of authorSelectors) {
    try {
      const el = doc.querySelector(selector);
      if (el) {
        const text = (el.textContent || '').trim();
        // Strip common prefixes
        const cleaned = text.replace(/^(by|written by|author:?)\s*/i, '').trim();
        if (cleaned && cleaned.length < 100) return cleaned;
      }
    } catch {
      // Invalid selector – skip
    }
  }

  return '';
}

/**
 * Extract the publish date from meta tags, LD+JSON, or <time> elements.
 */
function extractPublishDate(doc: Document): string {
  // Meta tags
  const dateMetas = [
    'meta[property="article:published_time"]',
    'meta[property="og:published_time"]',
    'meta[name="date"]',
    'meta[name="publish-date"]',
    'meta[name="DC.date"]',
    'meta[name="dcterms.created"]',
  ];

  for (const selector of dateMetas) {
    try {
      const el = doc.querySelector(selector);
      if (el) {
        const content = el.getAttribute('content')?.trim();
        if (content) {
          const parsed = new Date(content);
          if (!isNaN(parsed.getTime())) return parsed.toISOString();
        }
      }
    } catch {
      // skip
    }
  }

  // LD+JSON
  const ldJsonScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (let i = 0; i < ldJsonScripts.length; i++) {
    try {
      const data = JSON.parse(ldJsonScripts[i].textContent || '');
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        const dateStr = item.datePublished || item.dateCreated;
        if (dateStr) {
          const parsed = new Date(dateStr);
          if (!isNaN(parsed.getTime())) return parsed.toISOString();
        }
      }
    } catch {
      // skip
    }
  }

  // <time> element with datetime attribute
  const timeEl = doc.querySelector('time[datetime]');
  if (timeEl) {
    const dt = timeEl.getAttribute('datetime')?.trim();
    if (dt) {
      const parsed = new Date(dt);
      if (!isNaN(parsed.getTime())) return parsed.toISOString();
    }
  }

  // <time> element with pubdate attribute
  const pubdateEl = doc.querySelector('time[pubdate]');
  if (pubdateEl) {
    const dt = pubdateEl.getAttribute('datetime')?.trim() || (pubdateEl.textContent || '').trim();
    if (dt) {
      const parsed = new Date(dt);
      if (!isNaN(parsed.getTime())) return parsed.toISOString();
    }
  }

  return '';
}

/**
 * Detect the document language.
 */
function extractLanguage(doc: Document): string {
  // <html lang="...">
  const htmlLang = doc.documentElement.getAttribute('lang');
  if (htmlLang) return htmlLang.trim().toLowerCase().split('-')[0];

  // <meta http-equiv="content-language">
  const metaLang = doc.querySelector('meta[http-equiv="content-language"]');
  if (metaLang) {
    const content = metaLang.getAttribute('content')?.trim();
    if (content) return content.toLowerCase().split('-')[0];
  }

  // <meta property="og:locale">
  const ogLocale = doc.querySelector('meta[property="og:locale"]');
  if (ogLocale) {
    const content = ogLocale.getAttribute('content')?.trim();
    if (content) return content.toLowerCase().split('_')[0];
  }

  return '';
}

/**
 * Count words in a text string.
 * Handles multiple scripts (Latin, CJK, etc.) with a reasonable approximation.
 */
function countWords(text: string): number {
  if (!text) return 0;

  // Count CJK characters (each counts as a word)
  const cjkMatches = text.match(/[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g);
  const cjkCount = cjkMatches ? cjkMatches.length : 0;

  // Count Latin/space-separated words
  const latinWords = text
    .replace(/[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g, '')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  return latinWords.length + cjkCount;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Extract readable content from a web page document.
 *
 * Identifies the main content area, strips boilerplate (navigation, ads,
 * sidebars, footers), and returns structured metadata plus clean body text.
 *
 * @param doc - The Document object to extract from
 * @returns ReadableContent with title, body, metadata, and statistics
 */
export function extractReadableContent(doc: Document): ReadableContent {
  if (!doc || !doc.documentElement) {
    return {
      title: '',
      description: '',
      author: '',
      publishDate: '',
      body: '',
      wordCount: 0,
      readingTime: 0,
      language: '',
    };
  }

  const title = extractTitle(doc);
  const description = extractDescription(doc);
  const author = extractAuthor(doc);
  const publishDate = extractPublishDate(doc);
  const language = extractLanguage(doc);

  // Find and extract the main content
  const contentRoot = findContentRoot(doc);
  const body = contentRoot ? extractText(contentRoot) : '';

  const wordCount = countWords(body);
  const readingTime = Math.max(1, Math.ceil(wordCount / READING_WPM));

  return {
    title,
    description,
    author,
    publishDate,
    body,
    wordCount,
    readingTime,
    language,
  };
}
