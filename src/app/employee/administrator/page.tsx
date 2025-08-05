"use client";

import type { LegacyCustomerAttributes } from "@/models/legacy/db";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useEffect, useState } from "react";
import Background from "@/components/background";
import styles from "@/styles/administrator.module.css";

export default function Home() {
  const [customers, setCustomers] = useState<LegacyCustomerAttributes[]>([]);
  const [error, setError] = useState<string>("");
  const { user, isLoading } = useAuth();
  const [viewMode, setViewMode] = useState<"associates" | "quotes">(
    "associates"
  );

  const [editAssociate, setEditAssociate] = useState<any | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    address: "",
    password: "",
    commission: 0,
  });

  const [viewQuoteModalOpen, setViewQuoteModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any | null>(null);

  const [associates, setAssociates] = useState<any[]>([]);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    password: "",
    address: "",
    commission: 0,
  });
  const [addError, setAddError] = useState<string>("");

  const [quotes, setQuotes] = useState<any[]>([]);
  const [quoteFilters, setQuoteFilters] = useState({
    date_from: "",
    date_to: "",
    status: "",
    sales_associate_id: "",
    customer_id: "",
  });

  // Fetch customers when the component mounts and user is authenticated
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
      } catch (error) {
        console.error("Failed to fetch customers:", error);
        setError("Failed to fetch customers");
      }
    }

    if (!isLoading) {
      fetchCustomers();
    }
  }, [isLoading]);

  // Fetch associates when the component mounts
  async function fetchAssociates() {
    try {
      const res = await fetch("/api/employees/get?is_sales_associate=true");
      if (!res.ok) throw new Error("Failed to fetch associates");
      const data = await res.json();
      setAssociates(data);
    } catch (err) {
      setAddError("Could not load associates.");
    }
  }

  // Fetch associates on initial load
  useEffect(() => {
    fetchAssociates();
  }, []);

  // Fetch quotes when filters change
  useEffect(() => {
    async function fetchQuotes() {
      const params = new URLSearchParams();
      if (quoteFilters.date_from)
        params.append("date_from", quoteFilters.date_from);
      if (quoteFilters.date_to) params.append("date_to", quoteFilters.date_to);
      if (quoteFilters.status) params.append("status", quoteFilters.status);
      if (quoteFilters.sales_associate_id)
        params.append("sales_associate_id", quoteFilters.sales_associate_id);
      if (quoteFilters.customer_id)
        params.append("customer_id", quoteFilters.customer_id);

      const res = await fetch(`/api/quotes/get?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setQuotes(data);
      }
    }

    fetchQuotes();
  }, [quoteFilters]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <Background />
        <div className={styles.content}>
          <div className={styles.welcomeCard}>
            <div className={styles.loginPrompt}>Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  // Handler to open modal and populate form
  function handleEditAssociate(associate: any) {
    setEditAssociate(associate);
    setEditForm({
      name: associate.name,
      address: associate.address || "",
      password: "",
      commission: associate.accumulated_commission || 0,
    });
    setEditModalOpen(true);
  }

  // Handler for form changes
  function handleEditFormChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: name === "commission" ? Number(value) : value,
    }));
  }

  // Handler to submit edit
  async function handleEditAssociateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editAssociate) return;
    const res = await fetch(
      `/api/employees/edit?employee_id=${editAssociate.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          address: editForm.address,
          password: editForm.password ? editForm.password : undefined,
          accumulated_commission: editForm.commission,
        }),
      }
    );
    if (res.ok) {
      setEditModalOpen(false);
      setEditAssociate(null);
      await fetchAssociates();
    }
  }

  // Fetch full quote details (includes line items, secret notes, sales associate)
  async function handleViewQuote(quoteId: number) {
    const res = await fetch(`/api/quotes/get?quote_id=${quoteId}`);
    if (res.ok) {
      const data = await res.json();
      setSelectedQuote(data);
      setViewQuoteModalOpen(true);
    }
  }

  // Handler to add an associate to DB
  async function handleAddAssociate(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    try {
      const res = await fetch("/api/employees/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name,
          email: addForm.email,
          password: addForm.password,
          address: addForm.address,
          accumulated_commission: addForm.commission,
          is_sales_associate: true,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setAddError(err.error || "Failed to add associate");
        return;
      }
      setAddForm({
        name: "",
        email: "",
        password: "",
        address: "",
        commission: 0,
      });
      // Refresh associates list
      const data = await res.json();
      setAssociates((prev) => [...prev, data]);
    } catch (err) {
      setAddError("Failed to add associate.");
    }
  }

  // Handler to delete an associate from DB
  async function handleDeleteAssociate(id: number) {
    if (!window.confirm("Are you sure you want to delete this associate?"))
      return;
    try {
      const res = await fetch(`/api/employees/delete?employee_id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to delete associate");
        return;
      }
      setAssociates((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert("Failed to delete associate.");
    }
  }

  // Main content of the administrator home page
  return (
    <div className={styles.container}>
      <Background />
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>Administration Panel</h1>
          <p className={styles.subtitle}>
            Manage your sales associates and quotes efficiently with our
            comprehensive platform.
          </p>
        </div>

        {!user ? (
          <div className={styles.welcomeCard}>
            <div className={styles.loginPrompt}>
              <p>Please log in to access the system.</p>
              <Link href="/login" className={styles.loginLink}>
                Login to Get Started
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className={styles.welcomeCard}>
              <div className={styles.welcomeMessage}>
                Welcome back, <strong>{user.name}</strong>!
              </div>
            </div>

            {/* Admin View Mode Toggle */}
            <div className={styles.viewModeToggle}>
              <button
                type="button"
                className={`${styles.viewModeButton} ${
                  viewMode === "associates" ? styles.active : ""
                }`}
                onClick={() => setViewMode("associates")}
              >
                Sales Associates
              </button>
              <button
                type="button"
                className={`${styles.viewModeButton} ${
                  viewMode === "quotes" ? styles.active : ""
                }`}
                onClick={() => setViewMode("quotes")}
              >
                Quotes
              </button>
            </div>

            {/* Start Sales Associates View */}
            {viewMode === "associates" ? (
              <div className={styles.card}>
                {/* Start Sales Associates Table */}
                <h2 className={styles.sectionTitle}>Our Sales Associates</h2>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Commission</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {associates.map((associate) => (
                      <tr key={associate.id}>
                        <td>{associate.id}</td>
                        <td>{associate.name}</td>
                        <td>{associate.email}</td>
                        <td>
                          ${Number(associate.accumulated_commission).toFixed(2)}
                        </td>
                        <td>
                          <button
                            className={styles.actionButton}
                            onClick={() => handleEditAssociate(associate)}
                          >
                            Edit
                          </button>
                          <button
                            className={styles.deleteButton}
                            onClick={() => handleDeleteAssociate(associate.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* End Sales Associates Table */}

                {/* Sales Associate Count */}
                <p className={styles.countInfo}>
                  {associates.length} sales associate
                  {associates.length === 1 ? "" : "s"} found
                </p>

                {/* Start Add New Associates */}
                <div className={styles.formSection}>
                  <h4 className={styles.formTitle}>Add New Associate</h4>
                  <form
                    className={styles.addForm}
                    onSubmit={handleAddAssociate}
                  >
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="Name"
                      value={addForm.name}
                      onChange={(e) =>
                        setAddForm((f) => ({
                          ...f,
                          name: e.target.value,
                        }))
                      }
                      required
                    />
                    <input
                      type="email"
                      className={styles.formInput}
                      placeholder="Email"
                      value={addForm.email}
                      onChange={(e) =>
                        setAddForm((f) => ({
                          ...f,
                          email: e.target.value,
                        }))
                      }
                      required
                    />
                    <input
                      type="password"
                      className={styles.formInput}
                      placeholder="Password"
                      value={addForm.password}
                      onChange={(e) =>
                        setAddForm((f) => ({
                          ...f,
                          password: e.target.value,
                        }))
                      }
                      required
                    />
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="Address"
                      value={addForm.address}
                      onChange={(e) =>
                        setAddForm((f) => ({
                          ...f,
                          address: e.target.value,
                        }))
                      }
                      required
                    />
                    <input
                      type="number"
                      className={styles.formInput}
                      placeholder="Commission"
                      value={addForm.commission}
                      onChange={(e) =>
                        setAddForm((f) => ({
                          ...f,
                          commission: Number(e.target.value),
                        }))
                      }
                      min={0}
                      step={0.01}
                    />
                    <button type="submit" className={styles.submitButton}>
                      Add new associate
                    </button>
                  </form>
                  {addError && (
                    <div className={styles.errorMessage}>{addError}</div>
                  )}
                </div>
                {/* End Add New Associates */}
              </div>
            ) : (
              <div className={styles.card}>
                {/* Start Quotes View */}
                <h2 className={styles.sectionTitle}>Quotes</h2>

                {/* Filter Controls */}
                <div className={styles.filterForm}>
                  <input
                    type="date"
                    className={styles.formInput}
                    value={quoteFilters.date_from}
                    onChange={(e) =>
                      setQuoteFilters((f) => ({
                        ...f,
                        date_from: e.target.value,
                      }))
                    }
                  />
                  <input
                    type="date"
                    className={styles.formInput}
                    value={quoteFilters.date_to}
                    onChange={(e) =>
                      setQuoteFilters((f) => ({
                        ...f,
                        date_to: e.target.value,
                      }))
                    }
                  />
                  <select
                    className={styles.select}
                    value={quoteFilters.status}
                    onChange={(e) =>
                      setQuoteFilters((f) => ({
                        ...f,
                        status: e.target.value,
                      }))
                    }
                  >
                    <option value="">Status</option>
                    <option value="DraftQuote">Draft Quote</option>
                    <option value="FinalizedUnresolvedQuote">
                      Finalized Unresolved Quote
                    </option>
                    <option value="SanctionedQuote">Sanctioned Quote</option>
                    <option value="UnprocessedPurchaseOrder">
                      Unprocessed Purchase Order
                    </option>
                    <option value="Processed">Processed</option>
                  </select>
                  <select
                    className={styles.select}
                    value={quoteFilters.sales_associate_id}
                    onChange={(e) =>
                      setQuoteFilters((f) => ({
                        ...f,
                        sales_associate_id: e.target.value,
                      }))
                    }
                  >
                    <option value="">Associate</option>
                    {associates.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className={styles.select}
                    value={quoteFilters.customer_id}
                    onChange={(e) =>
                      setQuoteFilters((f) => ({
                        ...f,
                        customer_id: e.target.value,
                      }))
                    }
                  >
                    <option value="">Customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quotes Table */}
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Date</th>
                      <th>Sales Associate</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map((quote) => (
                      <tr key={quote.id}>
                        <td>{quote.id}</td>
                        <td>{quote.date_created?.slice(0, 10)}</td>
                        <td>{quote.SalesAssociate?.name || ""}</td>
                        <td>
                          {customers.find((c) => c.id === quote.customer_id)
                            ?.name || ""}
                        </td>
                        <td>
                          $
                          {quote.LineItems
                            ? quote.LineItems.reduce(
                                (sum: number, item: any) =>
                                  sum + Number(item.price),
                                0
                              ).toFixed(2)
                            : "0.00"}
                        </td>
                        <td>{quote.status}</td>
                        <td>
                          <button
                            className={styles.actionButton}
                            onClick={() => handleViewQuote(quote.id)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* End Quotes View */}
              </div>
            )}
            {/* End Admin View Mode Toggle */}
          </div>
        )}
      </div>

      {/* Edit Associate Modal */}
      {editModalOpen && (
        <div className={styles.modal}>
          <div className={styles.modalDialog}>
            <form onSubmit={handleEditAssociateSubmit}>
              <div className={styles.modalHeader}>
                <h1 className={styles.modalTitle}>Edit Sales Associate</h1>
                <button
                  type="button"
                  className={styles.closeButton}
                  onClick={() => setEditModalOpen(false)}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Name</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    name="name"
                    value={editForm.name}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Address</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    name="address"
                    value={editForm.address}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Password</label>
                  <input
                    type="password"
                    className={styles.formInput}
                    name="password"
                    value={editForm.password}
                    onChange={handleEditFormChange}
                    placeholder="Leave blank to keep current password"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Commission</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    name="commission"
                    value={editForm.commission}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* End Edit Associate Modal */}

      {/* Start View Quote Modal */}
      {viewQuoteModalOpen && (
        <div className={styles.modal}>
          <div className={styles.modalDialog}>
            <div className={styles.modalHeader}>
              <h1 className={styles.modalTitle}>Quote Details</h1>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setViewQuoteModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              {selectedQuote ? (
                <div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Company Name:</span>{" "}
                    {selectedQuote.customer_name || ""}
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Address:</span>{" "}
                    {selectedQuote.address || ""}
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Email:</span>{" "}
                    {selectedQuote.email || ""}
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Sales Associate:</span>{" "}
                    {selectedQuote.SalesAssociate?.name || ""}
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Date:</span>{" "}
                    {selectedQuote.date_created}
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Status:</span>{" "}
                    {selectedQuote.status}
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Line Items:</span>
                    <div className={styles.detailList}>
                      {selectedQuote.LineItems?.map((item: any) => (
                        <div key={item.id} className={styles.detailListItem}>
                          {item.description} - ${item.price}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Secret Notes:</span>
                    <div className={styles.detailList}>
                      {selectedQuote.SecretNotes?.map((note: any) => (
                        <div key={note.id} className={styles.detailListItem}>
                          {note.content}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Total Cost:</span> $
                    {selectedQuote.LineItems
                      ? selectedQuote.LineItems.reduce(
                          (sum: number, item: any) => sum + Number(item.price),
                          0
                        ).toFixed(2)
                      : "0.00"}
                  </div>
                </div>
              ) : (
                <div>Loading...</div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setViewQuoteModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* End View Quote Modal */}
    </div>
  );
}
