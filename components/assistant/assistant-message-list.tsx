'use client';

import React, { useEffect, useRef } from 'react';
import {
  type ChatMessage,
  type AssistantStatus,
  DEFAULT_WELCOME_MESSAGE,
  formatMessageTime,
} from '@/lib/assistant/assistant-contracts';

export interface AssistantMessageListProps {
  messages: ChatMessage[];
  status: AssistantStatus;
  suggestedPromptsSlot?: React.ReactNode;
  onRetry?: () => void;
}

export function AssistantMessageList({
  messages,
  status,
  suggestedPromptsSlot,
  onRetry,
}: Readonly<AssistantMessageListProps>) {
  const scrollEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest turn whenever messages change or loading activates
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  return (
    <div
      tabIndex={0}
      role="log"
      aria-live="polite"
      aria-label="Assistant conversation history"
      className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-bg-base/40 focus:outline-hidden"
    >
      {messages.length === 0 ? (
        <div className="space-y-3.5">
          <div className="flex flex-col items-start gap-2 p-3.5 rounded-lg bg-bg-surface border border-border text-text-secondary text-xs leading-relaxed shadow-xs">
            <p className="font-medium text-text-primary">Welcome to Store Assistant</p>
            <p>{DEFAULT_WELCOME_MESSAGE}</p>
          </div>

          {suggestedPromptsSlot && (
            <div
              data-testid="assistant-suggested-prompts"
              className="animate-in fade-in duration-200"
            >
              {suggestedPromptsSlot}
            </div>
          )}
        </div>
      ) : (
        messages.map((msg) => {
          if (msg.status === 'error') {
            return (
              <div
                key={msg.id}
                data-testid="assistant-error-notice"
                className="bg-danger-light border border-danger-border text-danger text-xs rounded-md p-2.5 flex items-center justify-between gap-3 shadow-xs"
              >
                <span className="flex-1 leading-relaxed">{msg.content}</span>
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="shrink-0 font-medium text-xs text-danger hover:underline cursor-pointer px-1 py-0.5 select-none"
                    aria-label="Retry failed request"
                  >
                    Retry
                  </button>
                )}
              </div>
            );
          }

          const isUser = msg.role === 'user';
          const time = formatMessageTime(msg.timestamp);

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-primary text-text-light rounded-xl rounded-tr-xs shadow-xs'
                    : 'bg-bg-surface border border-border text-text-primary rounded-xl rounded-tl-xs shadow-xs'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              </div>

              {time && (
                <span
                  className={`text-[10px] text-text-muted mt-1 px-1 select-none ${
                    isUser ? 'text-right' : 'text-left'
                  }`}
                >
                  {time}
                </span>
              )}
            </div>
          );
        })
      )}

      {status === 'loading' && (
        <div className="flex flex-col items-start" data-testid="assistant-loading-indicator">
          <div className="bg-bg-surface border border-border px-3.5 py-2.5 rounded-xl rounded-tl-xs shadow-xs flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse" />
            <span className="text-text-muted text-xs font-normal select-none">
              Checking store records...
            </span>
          </div>
        </div>
      )}

      <div ref={scrollEndRef} aria-hidden="true" />
    </div>
  );
}
