'use client';

import React, { useState } from 'react';
import { Modal } from './modal';
import { useConfirm } from './confirm-provider';
import { useToast } from './toast-provider';

export function ModalToastShowcase() {
  const confirm = useConfirm();
  const { showToast } = useToast();

  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [lastActionStatus, setLastActionStatus] = useState<string | null>(null);

  // Scenario 1: Destructive action confirmation
  const handleDeleteProduct = async () => {
    setLastActionStatus('Confirmation pending...');
    const confirmed = await confirm({
      title: 'Delete Toyo?',
      message:
        'This removes Toyo and its three sizes from the product list. Past sales stay in the records.',
      confirmLabel: 'Delete product',
      variant: 'danger',
    });

    if (confirmed) {
      setLastActionStatus('Confirmed: Product deleted');
      showToast('Product deleted');
    } else {
      setLastActionStatus('Canceled: Zero mutations');
    }
  };

  // Scenario 2: Custom modal submit
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCustomModalOpen(false);
    showToast('Category saved');
    setLastActionStatus(`Saved category: ${categoryName || 'New Category'}`);
    setCategoryName('');
  };

  // Scenario 3: Single Toast
  const handleSingleToast = () => {
    showToast('Category saved');
    setLastActionStatus('Triggered affirmative toast (auto-dismiss in 2.8s)');
  };

  // Scenario 4: Rapid Stacked Toasts
  const handleRapidToasts = () => {
    showToast('Product added');
    setTimeout(() => showToast('Inventory updated'), 150);
    setTimeout(() => showToast('Settings saved'), 300);
    setLastActionStatus('Triggered 3 concurrent stacked toasts');
  };

  return (
    <section
      className="bg-bg-surface border border-border rounded-xl p-6 md:p-8 shadow-xs mt-8"
      aria-labelledby="modal-showcase-heading"
    >
      <div className="pb-4 mb-5 border-b border-border">
        <h2 id="modal-showcase-heading" className="text-xl font-bold tracking-tight text-text-primary">
          Modal Dialogs, Confirmations & Toast Notifications (ARL-5)
        </h2>
        <p className="text-sm text-text-muted mt-1 leading-relaxed">
          Interactive verification playground covering accessible modals, destructive action confirmations,
          Escape key & backdrop dismissal, and 2.8-second auto-dismissing toast notifications.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Scenario 1 */}
        <div className="p-4 rounded-lg border border-border bg-bg-base/40 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-danger px-2 py-0.5 rounded bg-danger-light border border-danger-border">
              Scenario 1
            </span>
            <h3 className="text-base font-semibold text-text-primary mt-2">
              Destructive Confirmation
            </h3>
            <p className="text-xs text-text-muted mt-1">
              Traps focus, confirms deletion with danger styling, or cancels with zero mutations.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDeleteProduct}
            className="mt-4 inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-[var(--r)] bg-danger hover:bg-danger/90 text-text-light transition-colors cursor-pointer shadow-xs"
          >
            Delete Product (Demo)
          </button>
        </div>

        {/* Scenario 2 */}
        <div className="p-4 rounded-lg border border-border bg-bg-base/40 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded bg-primary-light border border-primary-border">
              Scenario 2
            </span>
            <h3 className="text-base font-semibold text-text-primary mt-2">
              Modal Backdrop & Escape
            </h3>
            <p className="text-xs text-text-muted mt-1">
              Press Escape or click outside dimmed backdrop to dismiss and restore focus.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCustomModalOpen(true)}
            className="mt-4 inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-[var(--r)] bg-secondary hover:bg-secondary-hover text-text-primary border border-border transition-colors cursor-pointer shadow-xs"
          >
            Open Category Modal (Demo)
          </button>
        </div>

        {/* Scenario 3 */}
        <div className="p-4 rounded-lg border border-border bg-bg-base/40 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-success px-2 py-0.5 rounded bg-success-light border border-success-border">
              Scenario 3
            </span>
            <h3 className="text-base font-semibold text-text-primary mt-2">
              Toast Auto-Dismissal (2.8s)
            </h3>
            <p className="text-xs text-text-muted mt-1">
              Affirmative checkmark icon with copy that disappears after exactly 2.8 seconds.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSingleToast}
            className="mt-4 inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-[var(--r)] bg-primary hover:bg-primary-hover text-text-light transition-colors cursor-pointer shadow-xs"
          >
            Trigger Success Toast
          </button>
        </div>

        {/* Scenario 4 */}
        <div className="p-4 rounded-lg border border-border bg-bg-base/40 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary px-2 py-0.5 rounded bg-bg-surface border border-border">
              Scenario 4
            </span>
            <h3 className="text-base font-semibold text-text-primary mt-2">
              Non-Blocking Stacked Toasts
            </h3>
            <p className="text-xs text-text-muted mt-1">
              Stacks multiple toasts in bottom-right corner without blocking page interactions.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRapidToasts}
            className="mt-4 inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-[var(--r)] bg-secondary hover:bg-secondary-hover text-text-primary border border-border transition-colors cursor-pointer shadow-xs"
          >
            Trigger Rapid Toasts (x3)
          </button>
        </div>
      </div>

      {lastActionStatus && (
        <div className="mt-4 p-3 rounded-md bg-bg-muted border border-border text-xs text-text-secondary flex items-center justify-between">
          <span>
            <b>Live Operational Feedback:</b> {lastActionStatus}
          </span>
          <button
            type="button"
            onClick={() => setLastActionStatus(null)}
            className="text-text-muted hover:text-text-primary text-xs underline cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {/* Modal for Scenario 2 */}
      <Modal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        title="Add category"
        description="Categories group products so they are easier to find in sales and inventory."
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setIsCustomModalOpen(false)}
              className="bg-secondary hover:bg-secondary-hover text-text-primary border border-border rounded-[var(--r)] px-4 py-2 text-[14.5px] font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveCategory}
              className="bg-primary hover:bg-primary-hover text-text-light font-medium rounded-[var(--r)] px-4 py-2 text-[14.5px] transition-colors"
            >
              Save category
            </button>
          </div>
        }
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div>
            <label htmlFor="category-input" className="block text-sm font-medium text-text-primary mb-1.5">
              Category name
            </label>
            <input
              id="category-input"
              type="text"
              required
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Soy Sauce / Vinegar"
              className="w-full px-3.5 py-2 text-[14.5px] rounded-[var(--r)] bg-bg-input border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </form>
      </Modal>
    </section>
  );
}
