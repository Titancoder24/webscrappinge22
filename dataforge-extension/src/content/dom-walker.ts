/**
 * DOMWalker – Efficient DOM tree traversal utility for DataForge.
 *
 * Uses the native TreeWalker API for fast traversal, with support for
 * open shadow DOMs and same-origin iframes.
 */

/** Compact signature for an element used for deduplication / fingerprinting. */
export interface ElementSignature {
  tag: string;
  id: string;
  classes: string[];
  depth: number;
  childCount: number;
  textSnippet: string;
}

/** Callback supplied to walk methods. Return `false` to stop traversal. */
export type WalkCallback = (el: Element, depth: number) => boolean | void;

/**
 * Set of tag names that are never meaningful content containers.
 * Skipping these keeps traversal focused on visible content.
 */
const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'LINK', 'META', 'HEAD', 'BR', 'HR',
]);

export class DOMWalker {
  // -------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------

  /**
   * Walk the full DOM tree starting at `root`, invoking `callback` for every
   * Element node. Shadow roots and same-origin iframes are entered automatically.
   */
  walk(root: Node, callback: WalkCallback): void {
    this.walkInternal(root, callback, 0);
  }

  /**
   * Collect all elements matching `selector` under `root`, including
   * shadow DOMs and same-origin iframes.
   */
  queryAll(root: Element | Document, selector: string): Element[] {
    const results: Element[] = [];

    try {
      const matches = root.querySelectorAll(selector);
      for (let i = 0; i < matches.length; i++) {
        results.push(matches[i]);
      }
    } catch {
      // Invalid selector – return empty
      return results;
    }

    // Descend into shadow roots
    this.walk(root, (el: Element) => {
      if (el.shadowRoot) {
        try {
          const shadowMatches = el.shadowRoot.querySelectorAll(selector);
          for (let i = 0; i < shadowMatches.length; i++) {
            results.push(shadowMatches[i]);
          }
        } catch {
          // ignore
        }
      }
      return true;
    });

    // Descend into same-origin iframes
    const iframes = root.querySelectorAll('iframe');
    for (let i = 0; i < iframes.length; i++) {
      const doc = this.getIframeDocument(iframes[i] as HTMLIFrameElement);
      if (doc) {
        try {
          const iframeMatches = doc.querySelectorAll(selector);
          for (let j = 0; j < iframeMatches.length; j++) {
            results.push(iframeMatches[j]);
          }
        } catch {
          // ignore
        }
      }
    }

    return results;
  }

  /**
   * Return a compact signature object for an element.  Two elements that
   * produce the same signature are structurally equivalent.
   */
  getElementSignature(el: Element): ElementSignature {
    const text = (el.textContent || '').trim();
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      classes: Array.from(el.classList).sort(),
      depth: this.getStructuralDepth(el),
      childCount: el.children.length,
      textSnippet: text.slice(0, 80),
    };
  }

  /**
   * Return direct Element children of `el`, *including* slotted children
   * pulled from an open shadow root.
   */
  getChildren(el: Element): Element[] {
    const children: Element[] = [];

    if (el.shadowRoot) {
      // Collect slotted / shadow children
      const shadowChildren = el.shadowRoot.children;
      for (let i = 0; i < shadowChildren.length; i++) {
        children.push(shadowChildren[i]);
      }
    }

    const directChildren = el.children;
    for (let i = 0; i < directChildren.length; i++) {
      children.push(directChildren[i]);
    }

    return children;
  }

  /**
   * Number of ancestor elements between `el` and `<html>`.
   */
  getStructuralDepth(el: Element): number {
    let depth = 0;
    let current: Node | null = el.parentNode;
    while (current && current !== document) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        depth++;
      }
      current = current.parentNode;
    }
    return depth;
  }

  /**
   * Approximate visible area of `el` in px^2.  Returns 0 for invisible elements.
   */
  getVisualArea(el: Element): number {
    try {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return 0;
      return rect.width * rect.height;
    } catch {
      return 0;
    }
  }

  /**
   * Heuristic visibility check.  An element is considered visible if:
   * - It has a non-zero bounding rect
   * - Its computed `display` is not `none`
   * - Its computed `visibility` is not `hidden`
   * - Its computed `opacity` is > 0
   */
  isVisible(el: Element): boolean {
    try {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return false;

      const style = getComputedStyle(el);
      if (style.display === 'none') return false;
      if (style.visibility === 'hidden') return false;
      if (parseFloat(style.opacity) === 0) return false;

      return true;
    } catch {
      return false;
    }
  }

  // -------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------

  private walkInternal(root: Node, callback: WalkCallback, startDepth: number): void {
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode(node: Node): number {
          const el = node as Element;
          if (SKIP_TAGS.has(el.tagName)) {
            return NodeFilter.FILTER_REJECT; // skip node + subtree
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      },
    );

    let depth = startDepth;
    let lastParent: Node | null = root;
    let node: Node | null = walker.nextNode();

    while (node) {
      const el = node as Element;

      // Track depth changes
      if (el.parentNode !== lastParent) {
        depth = this.computeRelativeDepth(root, el, startDepth);
      }
      lastParent = el.parentNode;

      const result = callback(el, depth);
      if (result === false) return;

      // Enter open shadow roots
      if (el.shadowRoot) {
        this.walkInternal(el.shadowRoot, callback, depth + 1);
      }

      // Enter same-origin iframes
      if (el.tagName === 'IFRAME') {
        const doc = this.getIframeDocument(el as HTMLIFrameElement);
        if (doc?.body) {
          this.walkInternal(doc.body, callback, depth + 1);
        }
      }

      node = walker.nextNode();
    }
  }

  /**
   * Compute the depth of `el` relative to `root`, offset by `base`.
   */
  private computeRelativeDepth(root: Node, el: Element, base: number): number {
    let depth = 0;
    let current: Node | null = el.parentNode;
    while (current && current !== root) {
      depth++;
      current = current.parentNode;
    }
    return base + depth;
  }

  /**
   * Safely access an iframe's contentDocument.  Returns null for cross-origin
   * frames or any access error.
   */
  private getIframeDocument(iframe: HTMLIFrameElement): Document | null {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      // Reading doc.body forces a cross-origin security check
      if (doc?.body) return doc;
      return null;
    } catch {
      // Cross-origin – silently ignore
      return null;
    }
  }
}
