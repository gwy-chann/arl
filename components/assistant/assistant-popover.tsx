'use client';

import React from 'react';
import {
  type ChatMessage,
  type AssistantStatus,
} from '@/lib/assistant/assistant-contracts';
import { AssistantHeader } from './assistant-header';
import { AssistantMessageList } from './assistant-message-list';
import { AssistantInputBar } from './assistant-input-bar';
import { SuggestedQuestions } from './suggested-questions';

export interface AssistantPopoverProps {
  messages: ChatMessage[];
  status: AssistantStatus;
  inputValue: string;
  onInputChange: (val: string) => void;
  onSendMessage: (val?: string) => void;
  onRetry?: () => void;
  onClearMessages: () => void;
  onClose: () => void;
  suggestedPromptsSlot?: React.ReactNode;
}

export function AssistantPopover({
  messages,
  status,
  inputValue,
  onInputChange,
  onSendMessage,
  onRetry,
  onClearMessages,
  onClose,
  suggestedPromptsSlot,
}: Readonly<AssistantPopoverProps>) {
  return (
    <div
      role="dialog"
      aria-modal={false}
      aria-label="Store Assistant Chat"
      className="fixed bottom-6 right-6 z-50 flex flex-col w-[calc(100vw-2rem)] sm:w-[380px] h-[520px] max-h-[calc(100vh-6rem)] bg-bg-surface border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in duration-200"
    >
      <AssistantHeader
        status={status}
        messageCount={messages.length}
        onClear={onClearMessages}
        onMinimize={onClose}
      />

      <AssistantMessageList
        messages={messages}
        status={status}
        onRetry={onRetry}
        suggestedPromptsSlot={
          messages.length === 0
            ? (suggestedPromptsSlot ?? (
                <SuggestedQuestions
                  onSelectPrompt={(prompt) => onSendMessage(prompt)}
                  disabled={status === 'loading'}
                />
              ))
            : null
        }
      />

      <AssistantInputBar
        value={inputValue}
        status={status}
        onChange={onInputChange}
        onSubmit={() => onSendMessage()}
      />
    </div>
  );
}
