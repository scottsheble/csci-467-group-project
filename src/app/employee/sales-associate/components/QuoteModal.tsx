"use client";

import { useRef, useEffect } from "react";
import styles from "@/styles/sales-associate.module.css";
import modalStyles from "./QuoteModal.module.css";

interface LineItem {
  description: string;
  price: number;
}

interface QuoteModalProps {
  quoteForm: {
    customerName: string;
    address: string;
    contactInfo: string;
    email: string;
  };
  lineItems: LineItem[];
  secretNotes: string[];
  discountValue: number;
  discountType: "percent" | "amount";
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onLineItemsChange: (items: LineItem[]) => void;
  onSecretNotesChange: (notes: string[]) => void;
  onDiscountValueChange: (value: number) => void;
  onDiscountTypeChange: (type: "percent" | "amount") => void;
}

export default function QuoteModal({
  quoteForm,
  lineItems,
  secretNotes,
  discountValue,
  discountType,
  onClose,
  onSubmit,
  onFormChange,
  onLineItemsChange,
  onSecretNotesChange,
  onDiscountValueChange,
  onDiscountTypeChange,
}: QuoteModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
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

  function addLineItem() {
    onLineItemsChange([...lineItems, { description: "", price: 0 }]);
  }

  function removeLineItem(index: number) {
    onLineItemsChange(lineItems.filter((_, i) => i !== index));
  }

  function handleLineItemChange(index: number, field: string, value: string) {
    onLineItemsChange(
      lineItems.map((item, i) =>
        i === index
          ? { ...item, [field]: field === "price" ? Number(value) : value }
          : item
      )
    );
  }

  function addSecretNote() {
    onSecretNotesChange([...secretNotes, ""]);
  }

  function removeSecretNote(idx: number) {
    onSecretNotesChange(secretNotes.filter((_, i) => i !== idx));
  }

  function handleSecretNoteChange(idx: number, value: string) {
    onSecretNotesChange(secretNotes.map((note, i) => (i === idx ? value : note)));
  }

  const totalCost = lineItems.reduce((sum, item) => sum + Number(item.price), 0);
  const discountedCost =
    discountType === "percent"
      ? totalCost * (1 - discountValue / 100)
      : Math.max(totalCost - discountValue, 0);

  return (
    <div className={modalStyles.overlay}>
      <div className={modalStyles.modal} ref={modalRef}>
        <div className={modalStyles.header}>
          <h2 className={modalStyles.title}>
            Create Quote for {quoteForm.customerName}
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

        <form onSubmit={onSubmit} className={modalStyles.form}>
          <div className={modalStyles.section}>
            <h3 className={modalStyles.sectionTitle}>Customer Information</h3>
            
            <div className={modalStyles.formGroup}>
              <label className={modalStyles.label}>Quote for:</label>
              <input
                type="text"
                name="customerName"
                className={modalStyles.input}
                value={quoteForm.customerName}
                readOnly
              />
            </div>

            <div className={modalStyles.formGroup}>
              <label className={modalStyles.label}>Address:</label>
              <input
                type="text"
                name="address"
                className={modalStyles.input}
                value={quoteForm.address}
                readOnly
              />
            </div>

            <div className={modalStyles.formGroup}>
              <label className={modalStyles.label}>Contact Info:</label>
              <input
                type="text"
                name="contactInfo"
                className={modalStyles.input}
                value={quoteForm.contactInfo}
                readOnly
              />
            </div>

            <div className={modalStyles.formGroup}>
              <label className={modalStyles.label}>Email:</label>
              <input
                type="email"
                name="email"
                className={modalStyles.input}
                value={quoteForm.email}
                onChange={onFormChange}
                required
              />
            </div>
          </div>

          <div className={modalStyles.section}>
            <h3 className={modalStyles.sectionTitle}>Line Items</h3>
            
            {lineItems.map((item, idx) => (
              <div key={idx} className={modalStyles.lineItem}>
                <input
                  type="text"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) =>
                    handleLineItemChange(idx, "description", e.target.value)
                  }
                  className={modalStyles.input}
                  required
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={item.price}
                  onChange={(e) =>
                    handleLineItemChange(idx, "price", e.target.value)
                  }
                  className={modalStyles.priceInput}
                  required
                  min="0"
                  step="0.01"
                />
                <button
                  type="button"
                  className={modalStyles.removeButton}
                  onClick={() => removeLineItem(idx)}
                  disabled={lineItems.length === 1}
                  aria-label="Remove line item"
                >
                  Remove
                </button>
              </div>
            ))}
            
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={addLineItem}
            >
              Add Item
            </button>
          </div>

          <div className={modalStyles.section}>
            <h3 className={modalStyles.sectionTitle}>Secret Notes</h3>
            
            {secretNotes.map((note, idx) => (
              <div key={idx} className={modalStyles.noteItem}>
                <textarea
                  className={modalStyles.textarea}
                  value={note}
                  onChange={(e) => handleSecretNoteChange(idx, e.target.value)}
                  placeholder="Enter secret note..."
                />
                <button
                  type="button"
                  className={modalStyles.removeButton}
                  onClick={() => removeSecretNote(idx)}
                  disabled={secretNotes.length === 1}
                  aria-label="Remove secret note"
                >
                  Remove
                </button>
              </div>
            ))}
            
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={addSecretNote}
            >
              Add New Note
            </button>
          </div>

          <div className={modalStyles.section}>
            <h3 className={modalStyles.sectionTitle}>Discount</h3>
            
            <div className={modalStyles.discountRow}>
              <input
                type="number"
                className={modalStyles.discountInput}
                value={discountValue}
                min="0"
                onChange={(e) => onDiscountValueChange(Number(e.target.value))}
              />
              
              <div className={modalStyles.radioGroup}>
                <label className={modalStyles.radioLabel}>
                  <input
                    type="radio"
                    checked={discountType === "percent"}
                    onChange={() => onDiscountTypeChange("percent")}
                  />
                  Percent
                </label>
                <label className={modalStyles.radioLabel}>
                  <input
                    type="radio"
                    checked={discountType === "amount"}
                    onChange={() => onDiscountTypeChange("amount")}
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
              type="submit"
              className={styles.primaryButton}
              disabled={
                lineItems.length === 0 ||
                lineItems.some((item) => !item.description || item.price <= 0)
              }
            >
              Create Quote
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
