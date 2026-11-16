'use client';

import React from 'react';
import {
  type QuickPromptCategory,
  type QuickPromptItem,
  getGroupedQuickPrompts,
} from '@/lib/assistant/assistant-contracts';
import {
  InventoryCategoryIcon,
  SalesCategoryIcon,
  CustomersCategoryIcon,
  SettingsCategoryIcon,
} from './assistant-icons';

export interface SuggestedQuestionsProps {
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
  className?: string;
}

function CategoryIcon({ category }: Readonly<{ category: QuickPromptCategory }>) {
  switch (category) {
    case 'inventory':
      return <InventoryCategoryIcon className="w-3.5 h-3.5 text-text-muted" />;
    case 'sales':
      return <SalesCategoryIcon className="w-3.5 h-3.5 text-text-muted" />;
    case 'customers':
      return <CustomersCategoryIcon className="w-3.5 h-3.5 text-text-muted" />;
    case 'settings':
      return <SettingsCategoryIcon className="w-3.5 h-3.5 text-text-muted" />;
    default:
      return null;
  }
}

export function SuggestedQuestions({
  onSelectPrompt,
  disabled = false,
  className = '',
}: Readonly<SuggestedQuestionsProps>) {
  const groups = getGroupedQuickPrompts();

  return (
    <div
      role="region"
      aria-label="Suggested operational questions"
      className={`flex flex-col space-y-3.5 p-3.5 rounded-lg bg-bg-surface border border-border shadow-xs animate-in fade-in duration-200 ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted select-none">
          Suggested Questions
        </span>
      </div>

      <div className="space-y-3">
        {groups.map((group) => (
          <div key={group.category} className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-text-muted">
              <CategoryIcon category={group.category} />
              <span className="text-[11px] font-semibold uppercase tracking-wider select-none">
                {group.categoryLabel}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {group.items.map((item: QuickPromptItem) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelectPrompt(item.prompt)}
                  aria-label={`Ask: ${item.prompt}`}
                  className="inline-flex items-center text-xs font-medium text-text-primary bg-bg-base hover:bg-bg-hover active:bg-bg-muted border border-border hover:border-border-focus px-2.5 py-1.5 rounded-lg transition-colors focus-visible:ring-1 focus-visible:ring-border-focus focus-visible:outline-hidden disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-2xs"
                >
                  {item.shortLabel}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
