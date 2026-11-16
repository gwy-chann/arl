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
  const [isOpen, setIsOpen] = useState<boolean>(options?.initialOpen ?? false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<AssistantStatus>('idle');
  const [inputValue, setInputValue] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Restore state from sessionStorage on client mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedOpen = sessionStorage.getItem(STORAGE_KEY_OPEN);
      if (storedOpen !== null) {
        setIsOpen(storedOpen === 'true');
      }

      const storedMessages = sessionStorage.getItem(STORAGE_KEY_MESSAGES);
      if (storedMessages) {
        const parsed = JSON.parse(storedMessages);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
        }
      }
    } catch {
      // Ignore storage read errors (e.g. storage disabled or quota exceeded)
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Sync open state to sessionStorage
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(STORAGE_KEY_OPEN, isOpen ? 'true' : 'false');
    } catch {
      // Ignore storage write errors
    }
  }, [isOpen, isInitialized]);

  // Sync messages to sessionStorage
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    } catch {
      // Ignore storage write errors
    }
  }, [messages, isInitialized]);

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
        // Operational assistant response simulation (strict zero-emoji)
        // Downstream story ARL-34 / ARL-32 will link to the live Gemini route
        await new Promise((resolve) => setTimeout(resolve, 600));

        let replyContent = 'Store operational records are ready for review. You can check the Inventory or Sales tab for current metrics.';
        const lower = trimmedContent.toLowerCase();

        if (lower.includes('stock') || lower.includes('inventory')) {
          replyContent = 'Inventory ledger indicates active stock for Toyo, Suka, and Patis in 350ml, 1L, and 1gal sizes. Check the Inventory monitor for minimum threshold alerts.';
        } else if (lower.includes('sales') || lower.includes('revenue') || lower.includes('today')) {
          replyContent = 'Sales ledger records all confirmed transactions. Daily totals, receipt numbers, and payment status can be tracked under Sales and Executive Reports.';
        } else if (lower.includes('utang') || lower.includes('balance') || lower.includes('debt') || lower.includes('customer')) {
          replyContent = 'Customer accounts ledger tracks outstanding balances and payment history. Review the Utang Tracker under Customers for overdue collection notices.';
        } else if (lower.includes('price') || lower.includes('pricing') || lower.includes('cost')) {
          replyContent = 'Product catalog defines cost and retail pricing across all condiment variants. Visit Products to adjust margins or review package tiers.';
        }

        const assistantMessage = createChatMessage('assistant', replyContent);
        setMessages((prev) => [...prev, assistantMessage]);
        setStatus('idle');
      } catch {
        const errorMessage = createChatMessage(
          'assistant',
          'Unable to process query at this time. Please check network connection or try again.'
        );
        setMessages((prev) => [...prev, errorMessage]);
        setStatus('error');
      }
    },
    [inputValue]
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
