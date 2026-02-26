/**
 * DOMChangeWatcher – Single MutationObserver on document.body with subtree:true.
 *
 * Batches mutations via requestAnimationFrame for efficient processing.
 * Provides callbacks for element additions, removals, and attribute changes.
 */

export interface DOMChangeCallbacks {
  /** Called when new Element nodes are added to the DOM. */
  newElementsAdded?: (elements: Element[]) => void;
  /** Called when Element nodes are removed from the DOM. */
  elementsRemoved?: (elements: Element[]) => void;
  /** Called when attributes change on observed elements. */
  attributeChanged?: (element: Element, attributeName: string, oldValue: string | null) => void;
}

export class DOMChangeWatcher {
  private observer: MutationObserver | null = null;
  private callbacks: DOMChangeCallbacks = {};
  private pendingMutations: MutationRecord[] = [];
  private rafId: number | null = null;
  private isRunning = false;

  /**
   * Start observing the DOM for changes.
   *
   * @param callbacks - Handlers for different mutation types
   * @param root - Root node to observe (default document.body)
   */
  start(callbacks: DOMChangeCallbacks, root?: Node): void {
    if (this.isRunning) {
      this.stop();
    }

    this.callbacks = callbacks;
    const targetNode = root || document.body;

    if (!targetNode) {
      return;
    }

    this.observer = new MutationObserver((mutations: MutationRecord[]) => {
      this.pendingMutations.push(...mutations);
      this.scheduleFlush();
    });

    try {
      this.observer.observe(targetNode, {
        childList: true,
        subtree: true,
        attributes: !!callbacks.attributeChanged,
        attributeOldValue: !!callbacks.attributeChanged,
      });
      this.isRunning = true;
    } catch (err) {
      this.observer = null;
      this.isRunning = false;
    }
  }

  /** Stop observing and flush any pending mutations. */
  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.observer) {
      // Process any remaining mutations before stopping
      const remaining = this.observer.takeRecords();
      if (remaining.length > 0) {
        this.pendingMutations.push(...remaining);
        this.flushMutations();
      }
      this.observer.disconnect();
      this.observer = null;
    }

    this.pendingMutations = [];
    this.isRunning = false;
  }

  /** Whether the watcher is currently observing. */
  get active(): boolean {
    return this.isRunning;
  }

  /** Temporarily pause observation without destroying the observer. */
  pause(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  /** Resume observation after a pause. Re-observes document.body. */
  resume(root?: Node): void {
    if (!this.observer || !this.isRunning) return;

    const targetNode = root || document.body;
    if (!targetNode) return;

    try {
      this.observer.observe(targetNode, {
        childList: true,
        subtree: true,
        attributes: !!this.callbacks.attributeChanged,
        attributeOldValue: !!this.callbacks.attributeChanged,
      });
    } catch {
      // Node may have been detached
    }
  }

  /**
   * Wait for DOM mutations to settle (no new mutations for `quietPeriodMs`).
   * Resolves when the DOM is stable or rejects after `timeoutMs`.
   */
  waitForSettle(quietPeriodMs: number = 500, timeoutMs: number = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      let quietTimer: ReturnType<typeof setTimeout> | null = null;
      let settled = false;

      const timeoutTimer = setTimeout(() => {
        cleanup();
        reject(new Error('DOM did not settle within timeout'));
      }, timeoutMs);

      const tempObserver = new MutationObserver(() => {
        if (quietTimer !== null) {
          clearTimeout(quietTimer);
        }
        quietTimer = setTimeout(() => {
          cleanup();
          resolve();
        }, quietPeriodMs);
      });

      const cleanup = (): void => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutTimer);
        if (quietTimer !== null) {
          clearTimeout(quietTimer);
        }
        tempObserver.disconnect();
      };

      try {
        tempObserver.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
        });
      } catch {
        cleanup();
        resolve(); // If we cannot observe, consider it settled
        return;
      }

      // Start the initial quiet period timer
      quietTimer = setTimeout(() => {
        cleanup();
        resolve();
      }, quietPeriodMs);
    });
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private scheduleFlush(): void {
    if (this.rafId !== null) return;

    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.flushMutations();
    });
  }

  private flushMutations(): void {
    const mutations = this.pendingMutations;
    this.pendingMutations = [];

    if (mutations.length === 0) return;

    const addedElements: Element[] = [];
    const removedElements: Element[] = [];
    const addedSet = new Set<Element>();
    const removedSet = new Set<Element>();

    for (let i = 0; i < mutations.length; i++) {
      const mutation = mutations[i];

      if (mutation.type === 'childList') {
        // Collect added elements
        const added = mutation.addedNodes;
        for (let j = 0; j < added.length; j++) {
          const node = added[j];
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;
            if (!addedSet.has(el)) {
              addedSet.add(el);
              addedElements.push(el);
            }
            // Also collect nested elements within the added subtree
            try {
              const nested = el.querySelectorAll('*');
              for (let k = 0; k < nested.length; k++) {
                if (!addedSet.has(nested[k])) {
                  addedSet.add(nested[k]);
                  addedElements.push(nested[k]);
                }
              }
            } catch {
              // querySelectorAll may fail on certain node types
            }
          }
        }

        // Collect removed elements
        const removed = mutation.removedNodes;
        for (let j = 0; j < removed.length; j++) {
          const node = removed[j];
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;
            if (!removedSet.has(el)) {
              removedSet.add(el);
              removedElements.push(el);
            }
          }
        }
      }

      if (mutation.type === 'attributes' && this.callbacks.attributeChanged) {
        const target = mutation.target;
        if (target.nodeType === Node.ELEMENT_NODE) {
          try {
            this.callbacks.attributeChanged(
              target as Element,
              mutation.attributeName || '',
              mutation.oldValue,
            );
          } catch {
            // Swallow callback errors
          }
        }
      }
    }

    // Remove elements that were both added and removed in the same frame (transient nodes)
    const transient = new Set<Element>();
    for (const el of addedSet) {
      if (removedSet.has(el)) {
        transient.add(el);
      }
    }

    if (this.callbacks.newElementsAdded) {
      const filtered = transient.size > 0
        ? addedElements.filter(el => !transient.has(el))
        : addedElements;
      if (filtered.length > 0) {
        try {
          this.callbacks.newElementsAdded(filtered);
        } catch {
          // Swallow callback errors
        }
      }
    }

    if (this.callbacks.elementsRemoved) {
      const filtered = transient.size > 0
        ? removedElements.filter(el => !transient.has(el))
        : removedElements;
      if (filtered.length > 0) {
        try {
          this.callbacks.elementsRemoved(filtered);
        } catch {
          // Swallow callback errors
        }
      }
    }
  }
}
