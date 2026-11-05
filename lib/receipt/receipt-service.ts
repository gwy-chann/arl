import type { SaleTransactionDTO } from '../sales/sale-contracts.ts';
import type { ReceiptItem, ReceiptPaymentStatus, ReceiptSnapshot } from './receipt-contracts.ts';

/**
 * Formats a transaction date into short month, day, and year (e.g. "Oct 11, 2026").
 */
export function formatReceiptDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

/**
 * Formats standard packaging size tokens into user-friendly display labels.
 */
export function formatVariantSize(size?: string): string {
  if (!size) return '';
  if (size === '350') return '350 ml';
  if (size === '1L') return '1 L';
  if (size === 'gal') return '1 gal';
  return size;
}

/**
 * Combines product name and variant packaging size into a clean label (e.g. "Patis - 1 L").
 */
export function formatVariantLabel(productName?: string, size?: string): string {
  const name = productName || 'Product';
  const formattedSize = formatVariantSize(size);
  return formattedSize ? `${name} - ${formattedSize}` : name;
}

/**
 * Classifies uppercase payment status stamp for physical thermal receipts.
 */
export function getReceiptPaymentStatus(amountPaid: number, balance: number): ReceiptPaymentStatus {
  if (balance <= 0) {
    return 'PAID';
  }
  if (amountPaid > 0) {
    return 'PARTIALLY PAID';
  }
  return 'NOT YET PAID';
}

/**
 * Formats numeric currency values into Philippine Peso presentation.
 */
export function formatPeso(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Transforms a SaleTransactionDTO into a thermal receipt snapshot.
 */
export function toReceiptSnapshot(sale: SaleTransactionDTO): ReceiptSnapshot {
  const formattedDate = formatReceiptDate(sale.created_at);
  const paymentStatus = getReceiptPaymentStatus(sale.amount_paid, sale.balance);

  const items: ReceiptItem[] = (sale.items || []).map((item) => {
    const variantLabel = formatVariantLabel(item.product_name, item.size);
    const lineTotal = item.quantity * item.unit_price;

    return {
      id: item.id,
      variant_id: item.variant_id,
      variant_label: variantLabel,
      product_name: item.product_name || 'Product',
      packaging_size: formatVariantSize(item.size),
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: lineTotal,
    };
  });

  return {
    id: sale.id,
    receipt_number: sale.receipt_number,
    created_at: sale.created_at,
    formatted_date: formattedDate,
    customer_id: sale.customer_id,
    customer_name: sale.customer_name || 'Walk-in Customer',
    items,
    total_amount: sale.total_amount,
    amount_paid: sale.amount_paid,
    balance: sale.balance,
    payment_status: paymentStatus,
  };
}
