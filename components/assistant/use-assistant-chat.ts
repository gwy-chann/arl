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

      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');
      setStatus('loading');

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
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
        } else {
          // Fallback simulation if route is unreachable
          await new Promise((resolve) => setTimeout(resolve, 500));
          let replyContent =
            'Store operational records are ready for review. You can check the Inventory or Sales tab for current metrics.';
          const lower = trimmedContent.toLowerCase();

          if (lower.includes('stock') || lower.includes('inventory')) {
            replyContent =
              'Inventory ledger indicates active stock for Toyo, Suka, and Patis in 350 ml, 1 L, and 1 gal sizes. Check the Inventory monitor for minimum threshold alerts.';
          } else if (
            lower.includes('sales') ||
            lower.includes('revenue') ||
            lower.includes('today')
          ) {
            replyContent =
              'Sales ledger records all confirmed transactions. Daily totals, receipt numbers, and payment status can be tracked under Sales and Executive Reports.';
          } else if (
            lower.includes('utang') ||
            lower.includes('balance') ||
            lower.includes('debt') ||
            lower.includes('customer')
          ) {
            replyContent =
              'Customer accounts ledger tracks outstanding balances and payment history. Review the Utang Tracker under Customers for overdue collection notices.';
          } else if (
            lower.includes('price') ||
            lower.includes('pricing') ||
            lower.includes('cost')
          ) {
            replyContent =
              'Product catalog defines cost and retail pricing across all condiment variants. Visit Products to adjust margins or review package tiers.';
          }

          const assistantMessage = createChatMessage('assistant', replyContent);
          setMessages((prev) => [...prev, assistantMessage]);
          setStatus('idle');
        }
      } catch {
        const errorMessage = createChatMessage(
          'assistant',
          'Unable to process query at this time. Please check network connection or try again.'
        );
        setMessages((prev) => [...prev, errorMessage]);
        setStatus('error');
      }
    },
    [inputValue, messages]
  );

  return {
    isOpen,
    setIsOpen,
    toggleOpen,
    messages,
    status,
    inputValue,
    setInputValue,
    sendMessage,
    clearMessages,
  };
}
