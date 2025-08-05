"use client";

import { useState } from "react";
import type { LegacyCustomerAttributes } from "@/models/legacy/db";
import QuoteModal from "./QuoteModal";
import styles from "@/styles/sales-associate.module.css";

interface LineItem {
  description: string;
  price: number;
}

interface QuoteCreationSectionProps {
  customers: LegacyCustomerAttributes[];
  onQuoteCreated: () => void;
  onModalStateChange: (isOpen: boolean) => void;
}

export default function QuoteCreationSection({
  customers,
  onQuoteCreated,
  onModalStateChange,
}: QuoteCreationSectionProps) {
  const [selectedCustomer, setSelectedCustomerId] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    customerName: "",
    address: "",
    contactInfo: "",
    email: "",
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [secretNotes, setSecretNotes] = useState<string[]>([""]);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountType, setDiscountType] = useState<"percent" | "amount">(
    "percent"
  );

  function handleOpenModal() {
    const customer = customers.find((c) => String(c.id) === selectedCustomer);
    setQuoteForm({
      customerName: customer?.name || "",
      address: customer ? `${customer.street}, ${customer.city}` : "",
      contactInfo: customer?.contact || "",
      email: "",
    });
    setLineItems([]);
    setSecretNotes([""]);
    setShowModal(true);
    onModalStateChange(true);
  }

  async function handleCreateQuote(e: React.FormEvent) {
    e.preventDefault();
    try {
      // Step 1: Create the quote
      const quoteRes = await fetch("/api/quotes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: quoteForm.email,
          customer_id: Number(selectedCustomer),
          final_discount_value: discountValue,
          final_discount_type:
            discountType === "percent" ? "percentage" : "amount",
        }),
        credentials: "include",
      });

      if (!quoteRes.ok) throw new Error("Failed to create quote");

      const quote = await quoteRes.json();
      const quoteId = quote.id;

      // Step 2: Create line items for the quote
      for (const item of lineItems) {
        if (item.description && item.price > 0) {
          const lineItemRes = await fetch(
            `/api/quotes/line-items/create?quote_id=${quoteId}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                description: item.description,
                price: item.price,
              }),
              credentials: "include",
            }
          );

          if (!lineItemRes.ok) {
            console.error("Failed to create line item:", item);
          }
        }
      }

      // Step 3: Create secret notes for the quote
      for (const note of secretNotes) {
        if (note && note.trim()) {
          const secretNoteRes = await fetch(
            `/api/quotes/secret-notes/create?quote_id=${quoteId}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                content: note.trim(),
              }),
              credentials: "include",
            }
          );

          if (!secretNoteRes.ok) {
            console.error("Failed to create secret note:", note);
          }
        }
      }

      setShowModal(false);
      onModalStateChange(false);
      setQuoteForm({
        customerName: "",
        address: "",
        contactInfo: "",
        email: "",
      });
      setSelectedCustomerId("");
      setLineItems([]);
      setSecretNotes([""]);
      setDiscountValue(0);
      setDiscountType("percent");
      onQuoteCreated();
      alert("Quote created successfully!");
    } catch (error) {
      alert(error);
    }
  }

  function handleCloseModal() {
    setShowModal(false);
    onModalStateChange(false);
  }

  function handleFormChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setQuoteForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>Create New Quote</h3>

      <div className={styles.customerSelect}>
        <select
          className={styles.select}
          aria-label="Select Customer"
          value={selectedCustomer}
          onChange={(e) => setSelectedCustomerId(e.target.value)}
        >
          <option value="" disabled>
            Select a customer
          </option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          className={styles.primaryButton}
          disabled={!selectedCustomer}
          onClick={handleOpenModal}
        >
          New Quote
        </button>
      </div>

      <p className={styles.customerCount}>
        {customers.length} customers available
      </p>

      {showModal && (
        <QuoteModal
          quoteForm={quoteForm}
          lineItems={lineItems}
          secretNotes={secretNotes}
          discountValue={discountValue}
          discountType={discountType}
          onClose={handleCloseModal}
          onSubmit={handleCreateQuote}
          onFormChange={handleFormChange}
          onLineItemsChange={setLineItems}
          onSecretNotesChange={setSecretNotes}
          onDiscountValueChange={setDiscountValue}
          onDiscountTypeChange={setDiscountType}
        />
      )}
    </div>
  );
}
