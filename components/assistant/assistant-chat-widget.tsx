'use client';

import React, { useEffect } from 'react';
import { useAssistantChat } from './use-assistant-chat';
import { AssistantLauncherPill } from './assistant-launcher-pill';
import { AssistantPopover } from './assistant-popover';

export interface AssistantChatWidgetProps {
  initialOpen?: boolean;
  suggestedPromptsSlot?: React.ReactNode;
}

export function AssistantChatWidget({
  initialOpen = false,
  suggestedPromptsSlot,
}: Readonly<AssistantChatWidgetProps>) {
  const {
    isOpen,
    setIsOpen,
    messages,
    status,
    inputValue,
    setInputValue,
    sendMessage,
    clearMessages,
  } = useAssistantChat({ initialOpen });

  // Global keyboard listener: Esc minimizes the popover
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, setIsOpen]);

  if (!isOpen) {
    return <AssistantLauncherPill onClick={() => setIsOpen(true)} />;
  }

  return (
    <AssistantPopover
      messages={messages}
      status={status}
      inputValue={inputValue}
      onInputChange={setInputValue}
      onSendMessage={sendMessage}
      onClearMessages={clearMessages}
      onClose={() => setIsOpen(false)}
      suggestedPromptsSlot={suggestedPromptsSlot}
    />
  );
}
