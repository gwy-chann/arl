import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_TOAST_DURATION,
  FOCUSABLE_ELEMENTS_SELECTOR,
  getNextFocusedIndex,
  lockBodyScroll,
  getActiveModalCount,
  resetActiveModalCount,
} from '../lib/modal-utils.ts';
import { MODAL_WIDTH_CLASSES } from '../specs/004-modal-dialog-toast-system/contracts/modal-toast-contracts.ts';

describe('Modal Dialog & Toast Notifications System (ARL-5)', () => {
  beforeEach(() => {
    resetActiveModalCount();
  });

  describe('Toast Notification Configuration & Constants', () => {
    test('default toast duration conforms to reference mockup (2.8 seconds / 2800ms)', () => {
      assert.strictEqual(DEFAULT_TOAST_DURATION, 2800);
    });

    test('modal width classes provide expected standard breakpoints', () => {
      assert.strictEqual(MODAL_WIDTH_CLASSES.sm, 'max-w-sm');
      assert.strictEqual(MODAL_WIDTH_CLASSES.md, 'max-w-md');
      assert.strictEqual(MODAL_WIDTH_CLASSES.lg, 'max-w-lg');
      assert.strictEqual(MODAL_WIDTH_CLASSES.xl, 'max-w-xl');
    });
  });

  describe('Focus Trap Navigation & Cyclic Looping', () => {
    test('selector includes all standard WCAG 2.1 AA focusable interactive targets', () => {
      assert.ok(FOCUSABLE_ELEMENTS_SELECTOR.includes('button:not([disabled])'));
      assert.ok(FOCUSABLE_ELEMENTS_SELECTOR.includes('input:not([disabled])'));
      assert.ok(FOCUSABLE_ELEMENTS_SELECTOR.includes('select:not([disabled])'));
      assert.ok(FOCUSABLE_ELEMENTS_SELECTOR.includes('textarea:not([disabled])'));
      assert.ok(FOCUSABLE_ELEMENTS_SELECTOR.includes('a[href]'));
      assert.ok(FOCUSABLE_ELEMENTS_SELECTOR.includes('[tabindex]:not([tabindex="-1"])'));
    });

    test('forward Tab navigation advances index', () => {
      const nextIndex = getNextFocusedIndex(0, 3, false);
      assert.strictEqual(nextIndex, 1);
    });

    test('forward Tab wraps from last element back to first (index 0)', () => {
      const wrappedIndex = getNextFocusedIndex(2, 3, false);
      assert.strictEqual(wrappedIndex, 0);
    });

    test('reverse Shift+Tab navigation decrements index', () => {
      const prevIndex = getNextFocusedIndex(2, 3, true);
      assert.strictEqual(prevIndex, 1);
    });

    test('reverse Shift+Tab wraps from first element (index 0) to last element', () => {
      const wrappedIndex = getNextFocusedIndex(0, 3, true);
      assert.strictEqual(wrappedIndex, 2);
    });

    test('handles empty or single element lists safely', () => {
      assert.strictEqual(getNextFocusedIndex(0, 0, false), -1);
      assert.strictEqual(getNextFocusedIndex(0, 1, false), 0);
      assert.strictEqual(getNextFocusedIndex(0, 1, true), 0);
    });
  });

  describe('Scroll Lock Counter Management', () => {
    test('increments and decrements active modal count correctly', () => {
      assert.strictEqual(getActiveModalCount(), 0);

      const unlock1 = lockBodyScroll();
      assert.strictEqual(getActiveModalCount(), 1);

      const unlock2 = lockBodyScroll();
      assert.strictEqual(getActiveModalCount(), 2);

      unlock2();
      assert.strictEqual(getActiveModalCount(), 1);

      unlock1();
      assert.strictEqual(getActiveModalCount(), 0);

      // Calling unlock multiple times is idempotent
      unlock1();
      assert.strictEqual(getActiveModalCount(), 0);
    });
  });
});
