"use client";

import { useState, useRef, useEffect } from "react";
import type { LegacyCustomerAttributes } from "@/models/legacy/db";
import styles from "@/styles/sales-associate.module.css";
import modalStyles from "./QuoteModal.module.css";

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

interface EditQuoteModalProps {
  quote: Quote;
  customer?: LegacyCustomerAttributes;
  onClose: () => void;
  onQuoteUpdated: () => void;
}

export default function EditQuoteModal({
  quote,
  customer,
  onClose,
  onQuoteUpdated,
}: EditQuoteModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const [editLineItems, setEditLineItems] = useState<LineItem[]>(
    Array.isArray(quote.LineItems) && quote.LineItems.length > 0
      ? quote.LineItems.map((li: any) => ({
          description: li.description || "",
          price: li.price || 0,
        }))
      : [{ description: "", price: 0 }]
  );

  const [editSecretNotes, setEditSecretNotes] = useState<string[]>(
    Array.isArray(quote.SecretNotes) && quote.SecretNotes.length > 0
      ? quote.SecretNotes.map((n: any) => n.content || "")
      : [""]
  );

  const [editDiscountValue, setEditDiscountValue] = useState<number>(
    quote.final_discount_value ?? 0
  );

  const [editDiscountType, setEditDiscountType] = useState<
    "percent" | "amount"
  >(
    quote.final_discount_type === "percentage"
      ? "percent"
      : quote.final_discount_type === "amount"
      ? "amount"
      : "percent"
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  function addEditLineItem() {
    setEditLineItems([...editLineItems, { description: "", price: 0 }]);
  }

  function removeEditLineItem(index: number) {
    setEditLineItems(editLineItems.filter((_, i) => i !== index));
  }

  function handleEditLineItemChange(
    index: number,
    field: string,
    value: string
  ) {
    setEditLineItems(
      editLineItems.map((item, i) =>
        i === index
          ? { ...item, [field]: field === "price" ? Number(value) : value }
          : item
      )
    );
  }

  function addEditSecretNote() {
    setEditSecretNotes([...editSecretNotes, ""]);
  }

  function removeEditSecretNote(idx: number) {
    setEditSecretNotes(editSecretNotes.filter((_, i) => i !== idx));
  }

  function handleEditSecretNoteChange(idx: number, value: string) {
    setEditSecretNotes(
      editSecretNotes.map((note, i) => (i === idx ? value : note))
    );
  }

  async function handleFinalizeQuote() {
    try {
      // Step 1: Get existing line items and secret notes to compare
      const currentQuoteResponse = await fetch(
        `/api/quotes/get?quote_id=${quote.id}`,
        {
          credentials: "include",
        }
      );

      if (!currentQuoteResponse.ok) {
        throw new Error("Failed to fetch current quote data");
      }

      const currentQuote = await currentQuoteResponse.json();

      // Step 2: Update line items
      // First, delete all existing line items
      if (currentQuote.LineItems && currentQuote.LineItems.length > 0) {
        for (const item of currentQuote.LineItems) {
          await fetch(`/api/quotes/line-items/delete?line_item_id=${item.id}`, {
            method: "DELETE",
            credentials: "include",
          });
        }
      }

      // Then create new line items
      for (const item of editLineItems) {
        if (item.description && item.price > 0) {
          await fetch(`/api/quotes/line-items/create?quote_id=${quote.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              description: item.description,
              price: item.price,
            }),
            credentials: "include",
          });
        }
      }

      // Step 3: Update secret notes
      // First, delete all existing secret notes
      if (currentQuote.SecretNotes && currentQuote.SecretNotes.length > 0) {
        for (const note of currentQuote.SecretNotes) {
          await fetch(
            `/api/quotes/secret-notes/delete?secret_note_id=${note.id}`,
            {
              method: "DELETE",
              credentials: "include",
            }
          );
        }
      }

      // Then create new secret notes
      for (const note of editSecretNotes) {
        if (note && note.trim()) {
          await fetch(`/api/quotes/secret-notes/create?quote_id=${quote.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: note.trim(),
            }),
            credentials: "include",
          });
        }
      }

      // Step 4: Update the quote status and discount
      const response = await fetch(`/api/quotes/edit?quote_id=${quote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          final_discount_value: editDiscountValue,
          final_discount_type:
            editDiscountType === "percent" ? "percentage" : "amount",
          status: "FinalizedUnresolvedQuote",
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to finalize quote");
      }

      onQuoteUpdated();
      alert("Quote finalized successfully!");
    } catch (error) {
      console.error("Error finalizing quote:", error);
      alert("Failed to finalize quote. Please try again.");
    }
  }

  const totalCost = editLineItems.reduce(
    (sum, item) => sum + Number(item.price),
    0
  );
  const discountedCost =
    editDiscountType === "percent"
      ? totalCost * (1 - editDiscountValue / 100)
      : Math.max(totalCost - editDiscountValue, 0);

  return (
    <div className={modalStyles.overlay}>
      <div className={modalStyles.modal} ref={modalRef}>
        <div className={modalStyles.header}>
          <h2 className={modalStyles.title}>
            Edit Quote for {customer?.name || "Unknown Customer"}
          </h2>
          <button
            type="button"
            className={modalStyles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className={modalStyles.form}>
          <div className={modalStyles.section}>
            <h3 className={modalStyles.sectionTitle}>Line Items</h3>

            {editLineItems.map((item, idx) => (
              <div key={idx} className={modalStyles.lineItem}>
                <input
                  type="text"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) =>
                    handleEditLineItemChange(idx, "description", e.target.value)
                  }
                  className={modalStyles.input}
                  required
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={item.price}
                  onChange={(e) =>
                    handleEditLineItemChange(idx, "price", e.target.value)
                  }
                  className={modalStyles.priceInput}
                  required
                  min="0"
                  step="0.01"
                />
                <button
                  type="button"
                  className={modalStyles.removeButton}
                  onClick={() => removeEditLineItem(idx)}
                  disabled={editLineItems.length === 1}
                  aria-label="Remove line item"
                >
                  Remove
                </button>
              </div>
            ))}

            <button
              type="button"
              className={styles.secondaryButton}
              onClick={addEditLineItem}
            >
              Add Item
            </button>
          </div>

          <div className={modalStyles.section}>
            <h3 className={modalStyles.sectionTitle}>Secret Notes</h3>

            {editSecretNotes.map((note, idx) => (
              <div key={idx} className={modalStyles.noteItem}>
                <textarea
                  className={modalStyles.textarea}
                  value={note}
                  onChange={(e) =>
                    handleEditSecretNoteChange(idx, e.target.value)
                  }
                  placeholder="Enter secret note..."
                />
                <button
                  type="button"
                  className={modalStyles.removeButton}
                  onClick={() => removeEditSecretNote(idx)}
                  disabled={editSecretNotes.length === 1}
                  aria-label="Remove secret note"
                >
                  Remove
                </button>
              </div>
            ))}

            <button
              type="button"
              className={styles.secondaryButton}
              onClick={addEditSecretNote}
            >
              Add New Note
            </button>
          </div>

          <div className={modalStyles.section}>
            <h3 className={modalStyles.sectionTitle}>Final Discount</h3>

            <div className={modalStyles.discountRow}>
              <input
                type="number"
                className={modalStyles.discountInput}
                value={editDiscountValue}
                min="0"
                onChange={(e) => setEditDiscountValue(Number(e.target.value))}
              />

              <div className={modalStyles.radioGroup}>
                <label className={modalStyles.radioLabel}>
                  <input
                    type="radio"
                    checked={editDiscountType === "percent"}
                    onChange={() => setEditDiscountType("percent")}
                  />
                  Percent
                </label>
                <label className={modalStyles.radioLabel}>
                  <input
                    type="radio"
                    checked={editDiscountType === "amount"}
                    onChange={() => setEditDiscountType("amount")}
                  />
                  Amount
                </label>
              </div>
            </div>
          </div>

          <div className={modalStyles.section}>
            <div className={modalStyles.totalRow}>
              <label className={modalStyles.totalLabel}>Total Amount:</label>
              <span className={modalStyles.totalAmount}>
                ${discountedCost.toFixed(2)}
              </span>
            </div>
          </div>

          <div className={modalStyles.buttonRow}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleFinalizeQuote}
              disabled={
                editLineItems.length === 0 ||
                editLineItems.some(
                  (item) => !item.description || item.price <= 0
                )
              }
            >
              Finalize Quote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
