/**
 * useChromeMessages - Hook for Chrome extension message communication.
 *
 * Sets up a chrome.runtime.onMessage listener, routes incoming messages
 * to registered handlers, and provides a `sendMessage` helper that sends
 * messages to the active tab's content script via the background service worker.
 *
 * Cleans up the listener automatically on unmount.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import type { Message } from '../../types/messages';
import { onMessage, sendRuntimeMessage, getActiveTab, sendTabMessage } from '../../utils/chrome-api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MessageHandler = (message: Message) => void;

export interface UseChromeMessagesReturn {
  /** Send a message through chrome.runtime (to background / other contexts). */
  sendMessage: (message: Message) => Promise<Message>;
  /** Send a message directly to the active tab's content script. */
  sendToActiveTab: (message: Message) => Promise<Message>;
  /** The most recently received message (useful for debugging / simple flows). */
  lastMessage: Message | null;
  /** Register a handler for a specific message type. Returns an unregister function. */
  on: (type: Message['type'], handler: MessageHandler) => () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useChromeMessages(): UseChromeMessagesReturn {
  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const handlersRef = useRef<Map<string, Set<MessageHandler>>>(new Map());

  // ---- Register handler for a specific message type ----
  const on = useCallback((type: Message['type'], handler: MessageHandler): (() => void) => {
    if (!handlersRef.current.has(type)) {
      handlersRef.current.set(type, new Set());
    }
    handlersRef.current.get(type)!.add(handler);

    return () => {
      const handlers = handlersRef.current.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          handlersRef.current.delete(type);
        }
      }
    };
  }, []);

  // ---- Set up global message listener ----
  useEffect(() => {
    const removeListener = onMessage((rawMessage, _sender, _sendResponse) => {
      const message = rawMessage as Message;
      if (!message || typeof message !== 'object' || !('type' in message)) {
        return;
      }

      setLastMessage(message);

      // Route to registered handlers
      const handlers = handlersRef.current.get(message.type);
      if (handlers) {
        for (const handler of handlers) {
          try {
            handler(message);
          } catch (err) {
            console.error(`[DataForge] Message handler error for ${message.type}:`, err);
          }
        }
      }
    });

    return removeListener;
  }, []);

  // ---- Send message via chrome.runtime ----
  const sendMessage = useCallback(async (message: Message): Promise<Message> => {
    try {
      const response = await sendRuntimeMessage<Message>(message);
      return response;
    } catch (err) {
      console.error('[DataForge] Failed to send runtime message:', err);
      throw err;
    }
  }, []);

  // ---- Send message to the active tab's content script ----
  const sendToActiveTab = useCallback(async (message: Message): Promise<Message> => {
    try {
      const tab = await getActiveTab();
      if (!tab?.id) {
        throw new Error('No active tab found');
      }
      const response = await sendTabMessage<Message>(tab.id, message);
      return response;
    } catch (err) {
      console.error('[DataForge] Failed to send tab message:', err);
      throw err;
    }
  }, []);

  return {
    sendMessage,
    sendToActiveTab,
    lastMessage,
    on,
  };
}
