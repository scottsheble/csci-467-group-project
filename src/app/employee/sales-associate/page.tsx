"use client";

import type { LegacyCustomerAttributes } from "@/models/legacy/db";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useRef } from "react";

interface LineItem {
  description: string;
  price: number;
}

export default function Home() {
  const [customers, setCustomers] = useState<LegacyCustomerAttributes[]>([]);
  const [error, setError] = useState<string>("");
  const { user, isLoading } = useAuth();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomerId] = useState<string>("");
  const [quoteForm, setQuoteForm] = useState({
    customerName: "",
    address: "",
    contactInfo: "",
    email: "",
    productDescription: "",
    price: "",
    secretNotes: "",
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", price: 0 },
  ]);
  const [secretNotes, setSecretNotes] = useState<string[]>([""]);

  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountType, setDiscountType] = useState<"percent" | "amount">(
    "percent"
  );

  const [editQuote, setEditQuote] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLineItems, setEditLineItems] = useState<LineItem[]>([]);
  const [editSecretNotes, setEditSecretNotes] = useState<string[]>([""]);
  const [editDiscountValue, setEditDiscountValue] = useState<number>(0);
  const [editDiscountType, setEditDiscountType] = useState<
    "percent" | "amount"
  >("percent");

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const response = await fetch("/api/customers/get");
        if (!response.ok) {
          if (response.status === 401) {
            setError("Please log in to view customers");
            return;
          }
          throw new Error("Network response was not ok");
        }
        const data: LegacyCustomerAttributes[] = await response.json();
        setCustomers(data);

        // Only fetch quotes if user is loaded and is a sales associate
        if (user && user.roles.is_sales_associate) {
          const quotesResponse = await fetch("/api/quotes/get");
          if (!quotesResponse.ok) {
            if (quotesResponse.status === 401) {
              setError("Please log in to view quotes");
              return;
            }
            throw new Error("Network response was not ok");
          }
          const quotesData = await quotesResponse.json();
          setQuotes(Array.isArray(quotesData) ? quotesData : []);
        }
      } catch (error) {
        console.error("Failed to fetch customers:", error);
        setError("Failed to fetch customers");
      }
    }
    // Only fetch when isLoading is false and user is available
    if (!isLoading && user) {
      fetchCustomers();
    }
  }, [isLoading, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Handle modal form
  function handleOpenModal() {
    const customer = customers.find((c) => String(c.id) === selectedCustomer);
    setQuoteForm({
      customerName: customer?.name || "",
      address: customer ? `${customer.street}, ${customer.city}` : "",
      contactInfo: customer?.contact || "",
      email: "",
      productDescription: "",
      price: "",
      secretNotes: "",
    });
    setLineItems([]); // <-- Start with no line items
    setSecretNotes([""]);
    setShowModal(true);
  }

  // Handle form creation of quotes
  async function handleCreateQuote(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/quotes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: quoteForm.email,
          customer_id: Number(selectedCustomer),
          lineItems,
          secretNotes,
          discountValue,
          discountType,
        }),
        credentials: "include", // <-- ensures cookies/session sent
      });
      const resText = await res.text();
      console.log("Create quote response:", res.status, resText);
      if (!res.ok) throw new Error("Failed to create quote");
      setShowModal(false);
      setQuoteForm({
        customerName: "",
        address: "",
        contactInfo: "",
        email: "",
        productDescription: "",
        price: "",
        secretNotes: "",
      });
      await refreshQuotes(); // Only fetch quotes after creating
      alert("Quote created successfully!");
    } catch (error) {
      alert(error);
    }
  }

  // Handle form changes
  function handleFormChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setQuoteForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // Async funtion to handle refreshing quotes
  async function refreshQuotes() {
    const quotesResponse = await fetch("/api/quotes/get?status=DraftQuote");
    if (quotesResponse.ok) {
      const quotesData = await quotesResponse.json();
      setQuotes(Array.isArray(quotesData) ? quotesData : []);
    }
  }

  //Handler funtions to add and remove line items
  function addLineItem() {
    setLineItems([...lineItems, { description: "", price: 0 }]);
  }

  function removeLineItem(index: number) {
    setLineItems(lineItems.filter((_, i) => i !== index));
  }

  function handleLineItemChange(index: number, field: string, value: string) {
    setLineItems(
      lineItems.map((item, i) =>
        i === index
          ? { ...item, [field]: field === "price" ? Number(value) : value }
          : item
      )
    );
  }

  // Add new secret note
  function addSecretNote() {
    setSecretNotes([...secretNotes, ""]);
  }

  // Remove secret note
  function removeSecretNote(idx: number) {
    setSecretNotes(secretNotes.filter((_, i) => i !== idx));
  }

  // Handle secret notes changes
  function handleSecretNoteChange(idx: number, value: string) {
    setSecretNotes(secretNotes.map((note, i) => (i === idx ? value : note)));
  }

  // Handle quote editing
  function handleEditQuote(quote: any) {
    setEditQuote(quote);
    setEditLineItems(
      Array.isArray(quote.LineItems) && quote.LineItems.length > 0
        ? quote.LineItems.map((li: any) => ({
            description: li.description || "",
            price: li.price || 0,
          }))
        : [{ description: "", price: 0 }]
    );
    setEditSecretNotes(
      Array.isArray(quote.SecretNotes) && quote.SecretNotes.length > 0
        ? quote.SecretNotes.map((n: any) => n.content || "")
        : [""]
    );
    setEditDiscountValue(quote.final_discount_value ?? 0);
    setEditDiscountType(quote.final_discount_type ?? "percent");
    setShowEditModal(true);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Quote Management System
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Streamline your sales quote process with our comprehensive management
          platform
        </p>

        {!user ? (
          <div className="space-y-4">
            <p className="text-gray-700">Please log in to access the system.</p>
            <Link
              href="/login"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md text-lg font-medium"
            >
              Login to Get Started
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-800">
                Welcome back, <strong>{user.name}</strong>!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {user.roles.is_sales_associate && (
                <div>
                  {/*  	
                  <Link
                    href="/quotes"
                    className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 text-center"
                  >
                    <h3 className="font-semibold text-blue-900">My Quotes</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Create and manage your quotes
                    </p>
                  </Link>
				*/}

                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h3 className="font-semibold text-blue-900">
                      Create new quote for Customer:
                    </h3>
                    <div className="flex flex-row items-center gap-4 mb-2">
                      <select
                        className="form-select flex-1"
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
                        className="btn btn-primary"
                        disabled={!selectedCustomer}
                        onClick={handleOpenModal}
                      >
                        New Quote
                      </button>
                    </div>
                    <p>{customers.length} current customers</p>
                  </div>

                  {showModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">
                          Create Quote for {quoteForm.customerName}
                        </h2>
                        <form onSubmit={handleCreateQuote}>
                          <div className="mb-2">
                            <label className="block font-medium">
                              Quote for:
                            </label>
                            <input
                              type="text"
                              name="customerName"
                              className="form-input w-full"
                              value={quoteForm.customerName}
                              readOnly
                            />
                          </div>
                          <div className="mb-2">
                            <label className="block font-medium">Address</label>
                            <input
                              type="text"
                              name="address"
                              className="form-input w-full"
                              value={quoteForm.address}
                              readOnly
                            />
                          </div>
                          <div className="mb-2">
                            <label className="block font-medium">
                              Contact Info
                            </label>
                            <input
                              type="text"
                              name="contactInfo"
                              className="form-input w-full"
                              value={quoteForm.contactInfo}
                              readOnly
                            />
                          </div>
                          <div className="mb-2">
                            <label className="block font-medium">Email</label>
                            <input
                              type="email"
                              name="email"
                              className="form-input w-full"
                              value={quoteForm.email}
                              onChange={handleFormChange}
                              required
                            />
                          </div>

                          {/* Line Items Section */}
                          <div className="mb-2">
                            <label className="block font-medium mb-1">
                              Line Items
                            </label>
                            {lineItems.map((item, idx) => (
                              <div key={idx} className="flex gap-2 mb-2">
                                <input
                                  type="text"
                                  placeholder="Description"
                                  value={item.description}
                                  onChange={(e) =>
                                    handleLineItemChange(
                                      idx,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  className="form-input flex-1"
                                  required
                                />
                                <input
                                  type="number"
                                  placeholder="Price"
                                  value={item.price}
                                  onChange={(e) =>
                                    handleLineItemChange(
                                      idx,
                                      "price",
                                      e.target.value
                                    )
                                  }
                                  className="form-input w-24"
                                  required
                                  min="0"
                                  step="0.01"
                                />
                                <button
                                  type="button"
                                  className="btn btn-danger"
                                  onClick={() => removeLineItem(idx)}
                                  disabled={lineItems.length === 1}
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={addLineItem}
                            >
                              Add Item
                            </button>
                          </div>

                          {/* Secret Notes Section */}
                          <div className="mb-2">
                            <label className="block font-medium mb-1">
                              Secret Notes
                            </label>
                            {secretNotes.map((note, idx) => (
                              <div key={idx} className="flex gap-2 mb-2">
                                <textarea
                                  className="form-textarea flex-1"
                                  value={note}
                                  onChange={(e) =>
                                    handleSecretNoteChange(idx, e.target.value)
                                  }
                                />
                                <button
                                  type="button"
                                  className="btn btn-danger"
                                  onClick={() => removeSecretNote(idx)}
                                  disabled={secretNotes.length === 1}
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={addSecretNote}
                            >
                              Add New Note
                            </button>
                          </div>

                          <div className="mb-2">
                            <label className="block font-medium">Amount:</label>
                            {(() => {
                              const totalCost = lineItems.reduce(
                                (sum, item) => sum + Number(item.price),
                                0
                              );
                              return <span>${totalCost.toFixed(2)}</span>;
                            })()}
                          </div>

                          <div className="flex justify-end gap-2 mt-4">
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => setShowModal(false)}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="btn btn-primary"
                              disabled={
                                lineItems.length === 0 ||
                                lineItems.some(
                                  (item) => !item.description || item.price <= 0
                                )
                              }
                            >
                              Create Quote
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold text-blue-900">
                      List of current quotes:
                    </h3>
                    <button
                      className="btn btn-outline-secondary mb-2"
                      onClick={refreshQuotes}
                    >
                      Refresh Quotes
                    </button>
                    <ul className="list-group">
                      {quotes.length === 0 ? (
                        <li className="list-group-item">No quotes found</li>
                      ) : (
                        [...quotes].map((quote, idx) => {
                          const customer = customers.find(
                            (c) => c.id === quote.customer_id
                          );
                          const totalCost = quote.LineItems
                            ? quote.LineItems.reduce(
                                (sum: number, item: LineItem) =>
                                  sum + Number(item.price),
                                0
                              )
                            : 0;
                          // Reverse numbering
                          const quoteNumber = quotes.length - idx;
                          return (
                            <li
                              key={quote.id}
                              className="list-group-item flex items-center gap-2"
                            >
                              <span className="font-bold mr-2">
                                {quoteNumber}.
                              </span>
                              Customer:{" "}
                              <strong>{customer?.name || "Unknown"}</strong>
                              {" | "}
                              Cost: <strong>${totalCost.toFixed(2)}</strong>
                              <button
                                className="btn btn-sm btn-outline-primary ml-2"
                                onClick={() => handleEditQuote(quote)}
                              >
                                Edit
                              </button>
                            </li>
                          );
                        })
                      )}
                    </ul>
                    <p>{quotes.length} quotes found</p>
                  </div>
                </div>
              )}

              {(user.roles.is_quote_manager || user.roles.is_admin) && (
                <Link
                  href="/quotes/manage"
                  className="bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg p-4 text-center"
                >
                  <h3 className="font-semibold text-purple-900">
                    Manage Quotes
                  </h3>
                  <p className="text-sm text-purple-700 mt-1">
                    Process and sanction quotes
                  </p>
                </Link>
              )}

              {(user.roles.is_purchase_manager || user.roles.is_admin) && (
                <Link
                  href="/purchase-orders"
                  className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-4 text-center"
                >
                  <h3 className="font-semibold text-green-900">
                    Purchase Orders
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    Convert quotes to orders
                  </p>
                </Link>
              )}

              {user.roles.is_admin && (
                <Link
                  href="/admin"
                  className="bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg p-4 text-center"
                >
                  <h3 className="font-semibold text-red-900">Administration</h3>
                  <p className="text-sm text-red-700 mt-1">
                    Manage employees and system
                  </p>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {showEditModal && editQuote && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              Edit Quote for {editQuote.customerName}
            </h2>
            {/* Line Items */}
            <div className="mb-2">
              <label className="block font-medium mb-1">Line Items</label>
              {editLineItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) =>
                      setEditLineItems(
                        editLineItems.map((li, i) =>
                          i === idx
                            ? { ...li, description: e.target.value }
                            : li
                        )
                      )
                    }
                    className="form-input flex-1"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={item.price}
                    onChange={(e) =>
                      setEditLineItems(
                        editLineItems.map((li, i) =>
                          i === idx
                            ? { ...li, price: Number(e.target.value) }
                            : li
                        )
                      )
                    }
                    className="form-input w-24"
                    required
                    min="0"
                    step="0.01"
                  />
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() =>
                      setEditLineItems(
                        editLineItems.filter((_, i) => i !== idx)
                      )
                    }
                    disabled={editLineItems.length === 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  setEditLineItems([
                    ...editLineItems,
                    { description: "", price: 0 },
                  ])
                }
              >
                Add Item
              </button>
            </div>
            {/* Secret Notes */}
            <div className="mb-2">
              <label className="block font-medium mb-1">Secret Notes</label>
              {editSecretNotes.map((note, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <textarea
                    className="form-textarea flex-1"
                    value={note}
                    onChange={(e) =>
                      setEditSecretNotes(
                        editSecretNotes.map((n, i) =>
                          i === idx ? e.target.value : n
                        )
                      )
                    }
                  />
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() =>
                      setEditSecretNotes(
                        editSecretNotes.filter((_, i) => i !== idx)
                      )
                    }
                    disabled={editSecretNotes.length === 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditSecretNotes([...editSecretNotes, ""])}
              >
                Add New Note
              </button>
            </div>
            {/* Final Cost */}
            <div className="mb-2">
              <label className="block font-medium">Amount:</label>
              {(() => {
                const totalCost = editLineItems.reduce(
                  (sum, item) => sum + Number(item.price),
                  0
                );
                return <span>${totalCost.toFixed(2)}</span>;
              })()}
            </div>
            {/* Finalize Button */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  // Call your API to update/finalize the quote here
                  await fetch(`/api/quotes/${editQuote.id}/finalize`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      lineItems: editLineItems, // Array of { description, price }
                      secretNotes: editSecretNotes, // Array of strings
                      final_discount_value: 0,
                      final_discount_type: "amount", // or "percent"
                      email: editQuote.email, // Customer email
                      customer_id: editQuote.customer_id, // Customer ID
                      status: "FinalizedUnresolvedQuote",
                      // Any other fields needed for quote manager
                    }),
                    credentials: "include",
                  });
                  setShowEditModal(false);
                  await refreshQuotes();
                }}
              >
                Finalize Quote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
