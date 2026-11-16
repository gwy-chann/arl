'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  type ChatMessage,
  type AssistantStatus,
  createChatMessage,
  SendMessageInputSchema,
} from '@/lib/assistant/assistant-contracts';

const STORAGE_KEY_MESSAGES = 'arlq_assistant_messages';
const STORAGE_KEY_OPEN = 'arlq_assistant_open';

export interface UseAssistantChatOptions {
  initialOpen?: boolean;
}

export function useAssistantChat(options?: UseAssistantChatOptions) {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (options?.initialOpen !== undefined) {
      return options.initialOpen;
    }
    if (typeof window === 'undefined') return false;
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY_OPEN);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY_MESSAGES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage read errors
    }
    return [];
  });

  const [status, setStatus] = useState<AssistantStatus>('idle');
  const [inputValue, setInputValue] = useState<string>('');
  const [lastFailedQuery, setLastFailedQuery] = useState<string | null>(null);

  // Sync open state to sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(STORAGE_KEY_OPEN, isOpen ? 'true' : 'false');
    } catch {
      // Ignore storage write errors
    }
  }, [isOpen]);

  // Sync messages to sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    } catch {
      // Ignore storage write errors
    }
  }, [messages]);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStatus('idle');
    setLastFailedQuery(null);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(STORAGE_KEY_MESSAGES);
      } catch {
        // Ignore
      }
    }
  }, []);

  const sendMessage = useCallback(
    async (customContent?: string) => {
      const textToSend = customContent !== undefined ? customContent : inputValue;
      const parseResult = SendMessageInputSchema.safeParse({ content: textToSend });
      if (!parseResult.success) return;

      const trimmedContent = parseResult.data.content;
      const userMessage = createChatMessage('user', trimmedContent);

      // Clean up any trailing error notice before dispatching new question
      setMessages((prev) => [...prev.filter((m) => m.status !== 'error'), userMessage]);
      setInputValue('');
      setStatus('loading');

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages.filter((m) => m.status !== 'error'), userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (res.ok) {
          const data = (await res.json()) as { content?: string };
          const assistantMessage = createChatMessage(
            'assistant',
            data.content || 'Store records retrieved.'
          );
          setMessages((prev) => [...prev, assistantMessage]);
          setStatus('idle');
          setLastFailedQuery(null);
        } else {
          const errorData = (await res.json().catch(() => ({}))) as { error?: string };
          const errorContent =
            typeof errorData?.error === 'string' && errorData.error.trim()
              ? errorData.error
              : 'Unable to process query at this time. Please check network connection or try again.';

          const errorMessage: ChatMessage = {
            id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            role: 'assistant',
            content: errorContent,
            timestamp: new Date().toISOString(),
            status: 'error',
          };
          setMessages((prev) => [...prev, errorMessage]);
          setStatus('error');
          setLastFailedQuery(trimmedContent);
        }
      } catch {
        const errorContent =
          'Unable to process query at this time. Please check network connection or try again.';
        const errorMessage: ChatMessage = {
          id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          role: 'assistant',
          content: errorContent,
          timestamp: new Date().toISOString(),
          status: 'error',
        };
        setMessages((prev) => [...prev, errorMessage]);
        setStatus('error');
        setLastFailedQuery(trimmedContent);
      }
    },
    [inputValue, messages]
  );

  const retryLastMessage = useCallback(() => {
    if (lastFailedQuery) {
      sendMessage(lastFailedQuery);
    }
  }, [lastFailedQuery, sendMessage]);

  return {
    isOpen,
    setIsOpen,
    toggleOpen,
    messages,
    status,
    inputValue,
    setInputValue,
    sendMessage,
    retryLastMessage,
    lastFailedQuery,
    clearMessages,
  };
}
