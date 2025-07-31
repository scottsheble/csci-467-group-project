"use client";

import type { LegacyCustomerAttributes } from "@/models/legacy/db";
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import React, { useEffect, useState } from "react";

export default function Home() {
	const [customers, setCustomers] = useState<LegacyCustomerAttributes[]>([]);
	const [error, setError] = useState<string>('');
	const { user, isLoading } = useAuth();

	useEffect(() => {
		async function fetchCustomers() {
			try {
				const response = await fetch('/api/customers/get');
				if (!response.ok) {
					if (response.status === 401) {
						setError('Please log in to view customers');
						return;
					}
					throw new Error('Network response was not ok');
				}
				const data: LegacyCustomerAttributes[] = await response.json();
				setCustomers(data);
			} catch (error) {
				console.error('Failed to fetch customers:', error);
				setError('Failed to fetch customers');
			}
		}

		if (!isLoading) {
			fetchCustomers();
		}
	}, [isLoading]);

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-lg">Loading...</div>
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<div className="text-center mb-8">
				<h1 className="text-4xl font-bold text-gray-900 mb-4">
					Welcome to Quote Management System
				</h1>
				<p className="text-lg text-gray-600 mb-8">
					Streamline your sales quote process with our comprehensive management platform
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
								<Link 
									href="/quotes"
									className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 text-center"
								>
									<h3 className="font-semibold text-blue-900">My Quotes</h3>
									<p className="text-sm text-blue-700 mt-1">Create and manage your quotes</p>
								</Link>
							)}
							
							{(user.roles.is_quote_manager || user.roles.is_admin) && (
								<Link 
									href="/quotes/manage"
									className="bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg p-4 text-center"
								>
									<h3 className="font-semibold text-purple-900">Manage Quotes</h3>
									<p className="text-sm text-purple-700 mt-1">Process and sanction quotes</p>
								</Link>
							)}
							
							{(user.roles.is_purchase_manager || user.roles.is_admin) && (
								<Link 
									href="/purchase-orders"
									className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-4 text-center"
								>
									<h3 className="font-semibold text-green-900">Purchase Orders</h3>
									<p className="text-sm text-green-700 mt-1">Convert quotes to orders</p>
								</Link>
							)}
							
							{user.roles.is_admin && (
								<Link 
									href="/admin"
									className="bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg p-4 text-center"
								>
									<h3 className="font-semibold text-red-900">Administration</h3>
									<p className="text-sm text-red-700 mt-1">Manage employees and system</p>
								</Link>
							)}
						</div>
					</div>
				)}
			</div>

			{user && (
				<div className="mt-12">
					<h2 className="text-2xl font-bold text-gray-900 mb-4">Customer Directory</h2>
					{error ? (
						<div className="bg-red-50 border border-red-200 rounded-md p-4">
							<p className="text-red-800">{error}</p>
						</div>
					) : customers.length > 0 ? (
						<div className="bg-white shadow overflow-hidden sm:rounded-md">
							<ul className="divide-y divide-gray-200">
								{customers.map(customer => (
									<li key={customer.id} className="px-6 py-4">
										<div className="flex items-center justify-between">
											<div>
												<h3 className="text-lg font-medium text-gray-900">{customer.name}</h3>
												<p className="text-sm text-gray-500">ID: {customer.id}</p>
											</div>
										</div>
									</li>
								))}
							</ul>
						</div>
					) : (
						<div className="bg-gray-50 border border-gray-200 rounded-md p-4">
							<p className="text-gray-700">No customers found.</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export function QuoteManagerPage() {
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedQuote, setSelectedQuote] = useState<any | null>(null);
    const [lineItems, setLineItems] = useState<any[]>([]);
    const [lineItemError, setLineItemError] = useState<string | null>(null);
    const [newLineItem, setNewLineItem] = useState({ description: "", price: "" });
    const [editingLineItemId, setEditingLineItemId] = useState<number | null>(null);
    const [editingLineItem, setEditingLineItem] = useState({ description: "", price: "" });
    const [secretNotes, setSecretNotes] = useState<any[]>([]);
    const [secretNoteError, setSecretNoteError] = useState<string | null>(null);
    const [newSecretNote, setNewSecretNote] = useState("");

    // Fetch finalized quotes on mount
    useEffect(() => {
        async function fetchQuotes() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch("/api/quotes/get?status=FinalizedUnresolvedQuote");
                if (!res.ok) throw new Error("Failed to fetch quotes");
                const data = await res.json();
                setQuotes(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchQuotes();
    }, []);

    // Fetch line items when a quote is selected
    useEffect(() => {
        if (!selectedQuote) return;
        async function fetchLineItems() {
            setLineItemError(null);
            try {
                const res = await fetch(`/api/quotes/line-items/get?quote_id=${selectedQuote.id}`);
                if (!res.ok) throw new Error("Failed to fetch line items");
                const data = await res.json();
                setLineItems(data);
            } catch (err: any) {
                setLineItemError(err.message);
            }
        }
        fetchLineItems();
    }, [selectedQuote]);

    // Fetch secret notes when a quote is selected
    useEffect(() => {
        if (!selectedQuote) return;
        async function fetchSecretNotes() {
            setSecretNoteError(null);
            try {
                const res = await fetch(`/api/quotes/secret-notes/get?quote_id=${selectedQuote.id}`);
                if (!res.ok) throw new Error("Failed to fetch secret notes");
                const data = await res.json();
                setSecretNotes(data);
            } catch (err: any) {
                setSecretNoteError(err.message);
            }
        }
        fetchSecretNotes();
    }, [selectedQuote]);

    // Add line item
    async function handleAddLineItem(e: React.FormEvent) {
        e.preventDefault();
        setLineItemError(null);
        try {
            const res = await fetch(`/api/quotes/line-items/create?quote_id=${selectedQuote.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description: newLineItem.description,
                    price: parseFloat(newLineItem.price),
                }),
            });
            if (!res.ok) throw new Error("Failed to add line item");
            setNewLineItem({ description: "", price: "" });
            // Refresh line items
            const data = await res.json();
            setLineItems(data);
        } catch (err: any) {
            setLineItemError(err.message);
        }
    }

    // Edit line item
    async function handleEditLineItem(e: React.FormEvent) {
        e.preventDefault();
        setLineItemError(null);
        try {
            const res = await fetch(`/api/quotes/line-items/edit?line_item_id=${editingLineItemId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description: editingLineItem.description,
                    price: parseFloat(editingLineItem.price),
                }),
            });
            if (!res.ok) throw new Error("Failed to edit line item");
            setEditingLineItemId(null);
            setEditingLineItem({ description: "", price: "" });
            // Refresh line items
            const data = await res.json();
            setLineItems(data);
        } catch (err: any) {
            setLineItemError(err.message);
        }
    }

    // Delete line item
    async function handleDeleteLineItem(lineItemId: number) {
        setLineItemError(null);
        try {
            const res = await fetch(`/api/quotes/line-items/delete?line_item_id=${lineItemId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete line item");
            // Refresh line items
            const data = await res.json();
            setLineItems(data);
        } catch (err: any) {
            setLineItemError(err.message);
        }
    }

    // Add secret note
    async function handleAddSecretNote(e: React.FormEvent) {
        e.preventDefault();
        setSecretNoteError(null);
        try {
            const res = await fetch(`/api/quotes/secret-notes/create?quote_id=${selectedQuote.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ note: newSecretNote }),
            });
            if (!res.ok) throw new Error("Failed to add secret note");
            setNewSecretNote("");
            // Refresh notes
            const data = await res.json();
            setSecretNotes(data);
        } catch (err: any) {
            setSecretNoteError(err.message);
        }
    }

    // Delete secret note
    async function handleDeleteSecretNote(noteId: number) {
        setSecretNoteError(null);
        try {
            const res = await fetch(`/api/quotes/secret-notes/delete?note_id=${noteId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete secret note");
            // Refresh secret notes
            const data = await res.json();
            setSecretNotes(data);
        } catch (err: any) {
            setSecretNoteError(err.message);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">Loading quotes...</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Quote Manager
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                    Manage and process your sales quotes efficiently
                </p>
            </div>

            <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Finalized Quotes</h2>
                {error ? (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <p className="text-red-800">{error}</p>
                    </div>
                ) : quotes.length > 0 ? (
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {quotes.map(quote => (
                                <li key={quote.id} className="px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900">{quote.title || `Quote #${quote.id}`}</h3>
                                            <p className="text-sm text-gray-500">ID: {quote.id}</p>
                                        </div>
                                        <button
                                            className="ml-4 px-3 py-1 bg-blue-600 text-white rounded"
                                            onClick={() => setSelectedQuote(quote)}
                                        >
                                            Manage Line Items
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                        <p className="text-gray-700">No finalized quotes found.</p>
                    </div>
                )}
            </div>

            {/* Line Items Management */}
            {selectedQuote && (
                <div className="mt-12">
                    <h2 className="text-xl font-bold mb-4">
                        Line Items for Quote #{selectedQuote.id}
                    </h2>
                    {lineItemError && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                            <p className="text-red-800">{lineItemError}</p>
                        </div>
                    )}
                    <form onSubmit={handleAddLineItem} className="flex gap-2 mb-4">
                        <input
                            type="text"
                            placeholder="Description"
                            value={newLineItem.description}
                            onChange={e => setNewLineItem({ ...newLineItem, description: e.target.value })}
                            className="border rounded px-2 py-1"
                            required
                        />
                        <input
                            type="number"
                            placeholder="Price"
                            value={newLineItem.price}
                            onChange={e => setNewLineItem({ ...newLineItem, price: e.target.value })}
                            className="border rounded px-2 py-1"
                            required
                            min="0"
                            step="0.01"
                        />
                        <button type="submit" className="bg-green-600 text-white px-4 py-1 rounded">
                            Add
                        </button>
                    </form>
                    <ul className="divide-y divide-gray-200">
                        {lineItems.map(item =>
                            editingLineItemId === item.id ? (
                                <li key={item.id} className="py-2 flex gap-2 items-center">
                                    <form onSubmit={handleEditLineItem} className="flex gap-2 items-center w-full">
                                        <input
                                            type="text"
                                            value={editingLineItem.description}
                                            onChange={e => setEditingLineItem({ ...editingLineItem, description: e.target.value })}
                                            className="border rounded px-2 py-1"
                                            required
                                        />
                                        <input
                                            type="number"
                                            value={editingLineItem.price}
                                            onChange={e => setEditingLineItem({ ...editingLineItem, price: e.target.value })}
                                            className="border rounded px-2 py-1"
                                            required
                                            min="0"
                                            step="0.01"
                                        />
                                        <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">
                                            Save
                                        </button>
                                        <button
                                            type="button"
                                            className="bg-gray-300 text-gray-800 px-3 py-1 rounded"
                                            onClick={() => setEditingLineItemId(null)}
                                        >
                                            Cancel
                                        </button>
                                    </form>
                                </li>
                            ) : (
                                <li key={item.id} className="py-2 flex gap-2 items-center">
                                    <span className="flex-1">{item.description}</span>
                                    <span className="w-24 text-right">${Number(item.price).toFixed(2)}</span>
                                    <button
                                        className="bg-yellow-500 text-white px-3 py-1 rounded"
                                        onClick={() => {
                                            setEditingLineItemId(item.id);
                                            setEditingLineItem({ description: item.description, price: String(item.price) });
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="bg-red-600 text-white px-3 py-1 rounded"
                                        onClick={() => handleDeleteLineItem(item.id)}
                                    >
                                        Delete
                                    </button>
                                </li>
                            )
                        )}
                    </ul>
                </div>
            )}

            {/* Secret Notes Management */}
            {selectedQuote && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-2">Secret Notes</h3>
                    {secretNoteError && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-2 mb-2">
                            <p className="text-red-800">{secretNoteError}</p>
                        </div>
                    )}
                    <form onSubmit={handleAddSecretNote} className="flex gap-2 mb-4">
                        <input
                            type="text"
                            placeholder="Add a secret note"
                            value={newSecretNote}
                            onChange={e => setNewSecretNote(e.target.value)}
                            className="border rounded px-2 py-1 flex-1"
                            required
                        />
                        <button type="submit" className="bg-indigo-600 text-white px-4 py-1 rounded">
                            Add Note
                        </button>
                    </form>
                    <ul className="divide-y divide-gray-200">
                        {secretNotes.map(note => (
                            <li key={note.id} className="py-2 text-gray-700">
                                {note.note}
                                <span className="ml-2 text-xs text-gray-400">
                                    {note.createdAt && new Date(note.createdAt).toLocaleString()}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Discount Management */}
            <div className="mt-8">
                <h3 className="text-lg font-semibold mb-2">Discount</h3>
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        setLineItemError(null);
                        try {
                            const res = await fetch(`/api/quotes/edit?quote_id=${selectedQuote.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    final_discount_value: selectedQuote.final_discount_value,
                                    final_discount_type: selectedQuote.final_discount_type,
                                }),
                            });
                            if (!res.ok) throw new Error("Failed to update discount");
                            // Refresh quote data
                            const updated = await res.json();
                            setSelectedQuote(updated);
                        } catch (err: any) {
                            setLineItemError(err.message);
                        }
                    }}
                    className="flex gap-2 items-center"
                >
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={selectedQuote.final_discount_value || ""}
                        onChange={e =>
                            setSelectedQuote((q: any) => ({
                                ...q,
                                final_discount_value: e.target.value
                            }))
                        }
                        className="border rounded px-2 py-1 w-32"
                        placeholder="Discount"
                        required
                    />
                    <select
                        value={selectedQuote.final_discount_type || ""}
                        onChange={e =>
                            setSelectedQuote((q: any) => ({
                                ...q,
                                final_discount_type: e.target.value
                            }))
                        }
                        className="border rounded px-2 py-1"
                        required
                    >
                        <option value="">Select type</option>
                        <option value="percentage">Percentage (%)</option>
                        <option value="amount">Amount ($)</option>
                    </select>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">
                        Update Discount
                    </button>
                </form>
            </div>

            {/* Final Price Calculation */}
            <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Final Price</h3>
                {(() => {
                    const subtotal = lineItems.reduce((sum, item) => sum + Number(item.price), 0);
                    let discount = 0;
                    if (
                        selectedQuote.final_discount_value &&
                        selectedQuote.final_discount_type
                    ) {
                        if (selectedQuote.final_discount_type === "percentage") {
                            discount = subtotal * (Number(selectedQuote.final_discount_value) / 100);
                        } else {
                            discount = Number(selectedQuote.final_discount_value);
                        }
                    }
                    const total = subtotal - discount;
                    return (
                        <div className="space-y-1">
                            <div>Subtotal: <span className="font-mono">${subtotal.toFixed(2)}</span></div>
                            <div>
                                Discount:{" "}
                                <span className="font-mono">
                                    {discount > 0
                                        ? (selectedQuote.final_discount_type === "percentage"
                                            ? `-${selectedQuote.final_discount_value}% ($${discount.toFixed(2)})`
                                            : `-$${discount.toFixed(2)}`)
                                        : "$0.00"}
                                </span>
                            </div>
                            <div className="font-bold text-lg">
                                Total: <span className="font-mono">${total.toFixed(2)}</span>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Sanction Quote Button */}
            <div className="mt-8">
                <button
                    className="bg-indigo-700 hover:bg-indigo-800 text-white px-6 py-2 rounded font-semibold"
                    onClick={async () => {
                        if (!window.confirm("Are you sure you want to sanction/finalize this quote? This will send it to the customer.")) return;
                        try {
                            const res = await fetch(`/api/quotes/edit?quote_id=${selectedQuote.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ status: "SanctionedQuote" }),
                            });
                            if (!res.ok) throw new Error("Failed to sanction quote");
                            const updated = await res.json();
                            setSelectedQuote(updated);
                            alert("Quote sanctioned and sent to customer!");
                        } catch (err: any) {
                            alert("Error: " + err.message);
                        }
                    }}
                    disabled={selectedQuote.status === "SanctionedQuote"}
                >
                    {selectedQuote.status === "SanctionedQuote"
                        ? "Quote Already Sanctioned"
                        : "Sanction & Send to Customer"}
                </button>
            </div>
        </div>
    );
}