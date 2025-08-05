"use client";

import { useState } from "react";
import type { LegacyCustomerAttributes } from "@/models/legacy/db";
import EditQuoteModal from "./EditQuoteModal";
import styles from "@/styles/sales-associate.module.css";

interface LineItem {
  description: string;
  price: number;
}

interface Quote {
  id: number;
  customer_id: number;
  email: string;
  final_discount_value?: number;
  final_discount_type?: "percentage" | "amount";
  LineItems?: LineItem[];
  SecretNotes?: { content: string }[];
}

interface QuotesListProps {
  quotes: Quote[];
  customers: LegacyCustomerAttributes[];
  onRefresh: () => void;
  onModalStateChange: (isOpen: boolean) => void;
}

export default function QuotesList({
  quotes,
  customers,
  onRefresh,
  onModalStateChange,
}: QuotesListProps) {
  const [editQuote, setEditQuote] = useState<Quote | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  function handleEditQuote(quote: Quote) {
    setEditQuote(quote);
    setShowEditModal(true);
    onModalStateChange(true);
  }

  function closeEditModal() {
    setShowEditModal(false);
    setEditQuote(null);
    onModalStateChange(false);
  }

  async function handleQuoteUpdated() {
    closeEditModal();
    await onRefresh();
  }

  return (
    <div className={styles.card}>
      <div className={styles.quotesHeader}>
        <h3 className={styles.cardTitle}>Current Quotes</h3>
        <button className={styles.secondaryButton} onClick={onRefresh}>
          Refresh Quotes
        </button>
      </div>

      <div className={styles.quotesList}>
        {quotes.length === 0 ? (
          <div className={styles.noQuotes}>No quotes found</div>
        ) : (
          [...quotes].reverse().map((quote, idx) => {
            const customer = customers.find((c) => c.id === quote.customer_id);
            const totalCost = quote.LineItems
              ? quote.LineItems.reduce(
                  (sum: number, item: LineItem) => sum + Number(item.price),
                  0
                )
              : 0;
            const discountedCost =
              quote.final_discount_type === "percentage"
                ? totalCost * (1 - (quote.final_discount_value || 0) / 100)
                : Math.max(totalCost - (quote.final_discount_value || 0), 0);

            // Reverse numbering
            const quoteNumber = quotes.length - idx;

            return (
              <div key={quote.id} className={styles.quoteItem}>
                <div className={styles.quoteInfo}>
                  <span className={styles.quoteNumber}>{quoteNumber}.</span>
                  Customer: <strong>{customer?.name || "Unknown"}</strong>
                  {" | "}
                  Cost: <strong>${discountedCost.toFixed(2)}</strong>
                </div>
                <button
                  className={styles.primaryButton}
                  onClick={() => handleEditQuote(quote)}
                >
                  Edit
                </button>
              </div>
            );
          })
        )}
      </div>

      <p className={styles.quoteCount}>{quotes.length} quotes found</p>

      {showEditModal && editQuote && (
        <EditQuoteModal
          quote={editQuote}
          customer={customers.find((c) => c.id === editQuote.customer_id)}
          onClose={closeEditModal}
          onQuoteUpdated={handleQuoteUpdated}
        />
      )}
    </div>
  );
}
