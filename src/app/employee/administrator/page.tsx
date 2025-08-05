"use client";

import type { LegacyCustomerAttributes } from "@/models/legacy/db";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
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
      commission: associate.commission || 0,
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

            {/* Admin View Mode Toggle */}
            <div className="container py-4">
              <div className="mb-4">
                <div className="btn-group" role="group">
                  <button
                    type="button"
                    className={`btn btn-outline-primary ${
                      viewMode === "associates" ? "active" : ""
                    }`}
                    onClick={() => setViewMode("associates")}
                  >
                    Sales Associates
                  </button>
                  <button
                    type="button"
                    className={`btn btn-outline-primary ${
                      viewMode === "quotes" ? "active" : ""
                    }`}
                    onClick={() => setViewMode("quotes")}
                  >
                    Quotes
                  </button>
                </div>
              </div>
              {/* Start Sales Associates View */}
              {viewMode === "associates" ? (
                <div>
                  {
                    <div>
                      {/* Start Sales Associates Table */}
                      <h2 className="mb-3">Our Sales Associates</h2>
                      <table className="table table-striped">
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
                                $
                                {Number(
                                  associate.accumulated_commission
                                ).toFixed(2)}
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-primary me-2"
                                  onClick={() => handleEditAssociate(associate)}
                                  data-bs-toggle="modal"
                                  data-bs-target="#editAssociateModal"
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() =>
                                    handleDeleteAssociate(associate.id)
                                  }
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
                      <p className="text-muted mb-2">
                        {associates.length} sales associate
                        {associates.length === 1 ? "" : "s"} found
                      </p>

                      {/* Start Add New Associates */}
                      <h4 className="mt-4">Add New Associate</h4>
                      <form
                        className="row g-2 align-items-center"
                        onSubmit={handleAddAssociate}
                      >
                        <div className="col-auto">
                          <input
                            type="text"
                            className="form-control"
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
                        </div>
                        <div className="col-auto">
                          <input
                            type="email"
                            className="form-control"
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
                        </div>
                        <div className="col-auto">
                          <input
                            type="password"
                            className="form-control"
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
                        </div>
                        <div className="col-auto">
                          <input
                            type="text"
                            className="form-control"
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
                        </div>
                        <div className="col-auto">
                          <input
                            type="number"
                            className="form-control"
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
                        </div>
                        <div className="col-auto">
                          <button type="submit" className="btn btn-success">
                            Add new associate
                          </button>
                        </div>
                        {addError && (
                          <div className="col-12 text-danger mt-2">
                            {addError}
                          </div>
                        )}
                      </form>
                      {/* End Add New Associates */}
                    </div>
                  }
                  {/* End Sales Associates View */}
                </div>
              ) : (
                <div>
                  {/* Start Quotes View */}

                  <div>
                    <h2 className="mb-3">Quotes</h2>
                    {/* Filter Controls */}
                    <form className="row g-2 mb-3">
                      <div className="col-auto">
                        <input
                          type="date"
                          className="form-control"
                          value={quoteFilters.date_from}
                          onChange={(e) =>
                            setQuoteFilters((f) => ({
                              ...f,
                              date_from: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="col-auto">
                        <input
                          type="date"
                          className="form-control"
                          value={quoteFilters.date_to}
                          onChange={(e) =>
                            setQuoteFilters((f) => ({
                              ...f,
                              date_to: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="col-auto">
                        <select
                          className="form-select"
                          value={quoteFilters.status}
                          onChange={(e) =>
                            setQuoteFilters((f) => ({
                              ...f,
                              status: e.target.value,
                            }))
                          }
                        >
                          <option value="">Status</option>
                          <option value="Draft">Draft</option>
                          <option value="Finalized">Finalized</option>
                        </select>
                      </div>
                      <div className="col-auto">
                        <select
                          className="form-select"
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
                      </div>
                      <div className="col-auto">
                        <select
                          className="form-select"
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
                    </form>

                    {/* Quotes Table */}
                    <table className="table table-striped">
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
                                className="btn btn-sm btn-info"
                                onClick={() => handleViewQuote(quote.id)}
                                data-bs-toggle="modal"
                                data-bs-target="#viewQuoteModal"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* End Quotes View */}
                </div>
              )}
            </div>
            {/* End Admin View Mode Toggle */}
          </div>
        )}
      </div>

      {/* Edit Associate Modal */}
      <div
        className={`modal fade${editModalOpen ? " show d-block" : ""}`}
        id="editAssociateModal"
        tabIndex={-1}
        aria-labelledby="editAssociateModalLabel"
        aria-hidden={!editModalOpen}
        style={editModalOpen ? { background: "rgba(0,0,0,0.5)" } : {}}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <form onSubmit={handleEditAssociateSubmit}>
              <div className="modal-header">
                <h1 className="modal-title fs-5" id="editAssociateModalLabel">
                  Edit Sales Associate
                </h1>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                  onClick={() => setEditModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="associateName" className="form-label">
                    Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="associateName"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="associateAddress" className="form-label">
                    Address
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="associateAddress"
                    name="address"
                    value={editForm.address}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="associatePassword" className="form-label">
                    Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="associatePassword"
                    name="password"
                    value={editForm.password}
                    onChange={handleEditFormChange}
                    placeholder="Leave blank to keep current password"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="associateCommission" className="form-label">
                    Commission
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="associateCommission"
                    name="commission"
                    value={editForm.commission}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* End Edit Associate Modal */}

      {/* Start View Quote Modal */}
      <div
        className={`modal fade${viewQuoteModalOpen ? " show d-block" : ""}`}
        id="viewQuoteModal"
        tabIndex={-1}
        aria-labelledby="viewQuoteModalLabel"
        aria-hidden={!viewQuoteModalOpen}
        style={viewQuoteModalOpen ? { background: "rgba(0,0,0,0.5)" } : {}}
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="viewQuoteModalLabel">
                Quote Details
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => setViewQuoteModalOpen(false)}
              ></button>
            </div>
            <div className="modal-body">
              {selectedQuote ? (
                <div>
                  <div className="mb-2">
                    <strong>Company Name:</strong>{" "}
                    {selectedQuote.customer_name || ""}
                  </div>
                  <div className="mb-2">
                    <strong>Address:</strong> {selectedQuote.address || ""}
                  </div>
                  <div className="mb-2">
                    <strong>Email:</strong> {selectedQuote.email || ""}
                  </div>
                  <div className="mb-2">
                    <strong>Sales Associate:</strong>{" "}
                    {selectedQuote.SalesAssociate?.name || ""}
                  </div>
                  <div className="mb-2">
                    <strong>Date:</strong> {selectedQuote.date_created}
                  </div>
                  <div className="mb-2">
                    <strong>Status:</strong> {selectedQuote.status}
                  </div>
                  <div className="mb-2">
                    <strong>Line Items:</strong>
                    <ul>
                      {selectedQuote.LineItems?.map((item: any) => (
                        <li key={item.id}>
                          {item.description} - ${item.price}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mb-2">
                    <strong>Secret Notes:</strong>
                    <ul>
                      {selectedQuote.SecretNotes?.map((note: any) => (
                        <li key={note.id}>{note.content}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mb-2">
                    <strong>Total Cost:</strong> $
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
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
                onClick={() => setViewQuoteModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* End View Quote Modal */}
    </div>
  );
}
