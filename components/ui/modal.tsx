'use client';

import React, { useEffect, useRef, useState, useId } from 'react';
import { createPortal } from 'react-dom';
import {
  lockBodyScroll,
  getNextFocusedIndex,
  getFocusableElements,
} from '@/lib/modal-utils';
import type { ModalProps, ModalMaxWidth } from '@/specs/004-modal-dialog-toast-system/contracts/modal-toast-contracts';

const WIDTH_CLASSES: Record<ModalMaxWidth, string> = {
  sm: 'max-w-sm',
  md: 'max-w-[460px]',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  initialFocusRef,
  className = '',
  portalTargetId = 'modal-root',
}: Readonly<ModalProps>) {
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  const titleId = useId();
  const descId = useId();

  // Handle client-side mount state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle scroll lock and focus management lifecycle
  useEffect(() => {
    if (!isOpen) return;

    // Cache active element before opening
    if (typeof document !== 'undefined') {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
    }

    // Lock body scroll
    const unlockScroll = lockBodyScroll();

    // Set initial focus
    const focusTimer = setTimeout(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else if (modalRef.current) {
        const focusables = getFocusableElements(modalRef.current);
        if (focusables.length > 0) {
          focusables[0].focus();
        } else {
          modalRef.current.focus();
        }
      }
    }, 20);

    return () => {
      clearTimeout(focusTimer);
      unlockScroll();

      // Restore previous focus on close
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, initialFocusRef]);

  // Handle keyboard events (Escape and cyclic focus trap)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key === 'Tab' && modalRef.current) {
        const focusables = getFocusableElements(modalRef.current);
        if (focusables.length === 0) {
          event.preventDefault();
          return;
        }

        const currentIndex = focusables.indexOf(document.activeElement as HTMLElement);
        const nextIndex = getNextFocusedIndex(currentIndex, focusables.length, event.shiftKey);

        event.preventDefault();
        focusables[nextIndex]?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen || !mounted) {
    return null;
  }

  const portalTarget =
    document.getElementById(portalTargetId) || document.body;

  const widthClass = WIDTH_CLASSES[maxWidth] || WIDTH_CLASSES.md;

  const modalContent = (
    <div
      className="fixed inset-0 bg-[#141613]/45 dark:bg-black/75 z-50 flex items-center justify-center p-4 animate-fade"
      onClick={(e) => {
        if (e.target === e.currentTarget && closeOnBackdropClick) {
          onClose();
        }
      }}
      data-testid="modal-backdrop"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={`bg-bg-surface border border-border text-text-primary rounded-[10px] shadow-2xl w-full ${widthClass} animate-pop flex flex-col focus:outline-none ${className}`}
        data-testid="modal-dialog"
      >
        {title && (
          <div className="px-5.5 pt-5 pb-1 flex items-center justify-between">
            <h3 id={titleId} className="text-[18px] font-semibold text-text-primary m-0">
              {title}
            </h3>
          </div>
        )}

        {description && (
          <div className="px-5.5 pt-1 text-[14.5px] text-text-muted">
            <p id={descId} className="m-0 leading-relaxed">
              {description}
            </p>
          </div>
        )}

        <div className="px-5.5 py-3 text-[15px] text-text-secondary leading-relaxed flex-1">
          {children}
        </div>

        {footer && (
          <div className="flex justify-end gap-2.5 px-5.5 pb-5 pt-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, portalTarget);
}
