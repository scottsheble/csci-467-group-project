"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Background from '@/components/background';
import styles from '@/styles/quote-manager.module.css';

interface Quote {
    id: number;
    email: string;
    customer_id: number;
    status: string;
    sales_associate_id: number;
    initial_discount_value?: number;
    initial_discount_type?: string;
    final_discount_value?: number;
    final_discount_type?: string;
    LineItems?: LineItem[];
    SalesAssociate?: Employee;
}

interface LineItem {
    id: number;
    description: string;
    price: number;
}

interface Employee {
    id: number;
    name: string;
    email: string;
}

export default function QuoteManagerPage() {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [updatingQuote, setUpdatingQuote] = useState<number | null>(null);
    const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [newLineItem, setNewLineItem] = useState({ description: '', price: '' });
    const [editingLineItem, setEditingLineItem] = useState<LineItem | null>(null);
    const [initialDiscount, setInitialDiscount] = useState({ value: '', type: 'percentage' });
    const [finalDiscount, setFinalDiscount] = useState({ value: '', type: 'percentage' });
    const [showPurchaseOrderModal, setShowPurchaseOrderModal] = useState(false);
    const { user, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading) {
            fetchQuotes();
        }
    }, [isLoading]);

    const fetchQuotes = async () => {
        try {
            const response = await fetch('/api/quotes/get');
            if (!response.ok) {
                if (response.status === 401) {
                    setError('Please log in to view quotes');
                    return;
                }
                throw new Error('Failed to fetch quotes');
            }
            const data = await response.json();
            setQuotes(data);
        } catch (error) {
            console.error('Failed to fetch quotes:', error);
            setError('Failed to fetch quotes');
        } finally {
            setLoading(false);
        }
    };

    const sanctionQuote = async (quoteId: number) => {
        setUpdatingQuote(quoteId);
        try {
            const response = await fetch(`/api/quotes/edit?quote_id=${quoteId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'SanctionedQuote'
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to sanction quote');
            }

            // Refresh quotes after successful update
            await fetchQuotes();
        } catch (error) {
            console.error('Failed to sanction quote:', error);
            setError(`Failed to sanction quote: ${(error as Error).message}`);
        } finally {
            setUpdatingQuote(null);
        }
    };

    const finalizeQuote = async (quoteId: number) => {
        setUpdatingQuote(quoteId);
        try {
            const response = await fetch(`/api/quotes/edit?quote_id=${quoteId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'FinalizedUnresolvedQuote'
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to finalize quote');
            }

            // Refresh quotes after successful update
            await fetchQuotes();
        } catch (error) {
            console.error('Failed to finalize quote:', error);
            setError(`Failed to finalize quote: ${(error as Error).message}`);
        } finally {
            setUpdatingQuote(null);
        }
    };

    // Line Item Management Functions
    const openQuoteModal = (quote: Quote) => {
        setEditingQuote(quote);
        setInitialDiscount({
            value: quote.initial_discount_value?.toString() || '',
            type: quote.initial_discount_type || 'percentage'
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingQuote(null);
        setEditingLineItem(null);
        setNewLineItem({ description: '', price: '' });
        setInitialDiscount({ value: '', type: 'percentage' });
    };

    const addLineItem = async () => {
        if (!editingQuote || !newLineItem.description || !newLineItem.price) return;

        try {
            const response = await fetch(`/api/quotes/line-items/create?quote_id=${editingQuote.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    description: newLineItem.description,
                    price: parseFloat(newLineItem.price)
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add line item');
            }

            setNewLineItem({ description: '', price: '' });
            await fetchQuotes();
            
            // Update the editing quote with fresh data
            const updatedQuotes = await fetch('/api/quotes/get');
            const data = await updatedQuotes.json();
            const updatedQuote = data.find((q: Quote) => q.id === editingQuote.id);
            if (updatedQuote) {
                setEditingQuote(updatedQuote);
            }
        } catch (error) {
            console.error('Failed to add line item:', error);
            setError(`Failed to add line item: ${(error as Error).message}`);
        }
    };

    const updateLineItem = async () => {
        if (!editingLineItem) return;

        try {
            const response = await fetch(`/api/quotes/line-items/edit?line_item_id=${editingLineItem.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    description: editingLineItem.description,
                    price: editingLineItem.price
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update line item');
            }

            setEditingLineItem(null);
            await fetchQuotes();
            
            // Update the editing quote with fresh data
            const updatedQuotes = await fetch('/api/quotes/get');
            const data = await updatedQuotes.json();
            const updatedQuote = data.find((q: Quote) => q.id === editingQuote?.id);
            if (updatedQuote) {
                setEditingQuote(updatedQuote);
            }
        } catch (error) {
            console.error('Failed to update line item:', error);
            setError(`Failed to update line item: ${(error as Error).message}`);
        }
    };

    const deleteLineItem = async (lineItemId: number) => {
        try {
            const response = await fetch(`/api/quotes/line-items/delete?line_item_id=${lineItemId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete line item');
            }

            await fetchQuotes();
            
            // Update the editing quote with fresh data
            const updatedQuotes = await fetch('/api/quotes/get');
            const data = await updatedQuotes.json();
            const updatedQuote = data.find((q: Quote) => q.id === editingQuote?.id);
            if (updatedQuote) {
                setEditingQuote(updatedQuote);
            }
        } catch (error) {
            console.error('Failed to delete line item:', error);
            setError(`Failed to delete line item: ${(error as Error).message}`);
        }
    };

    const updateQuoteDiscounts = async () => {
        if (!editingQuote) return;

        try {
            const body: any = {};
            
            if (initialDiscount.value) {
                body.initial_discount_value = parseFloat(initialDiscount.value);
                body.initial_discount_type = initialDiscount.type;
            }

            const response = await fetch(`/api/quotes/edit?quote_id=${editingQuote.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update discounts');
            }

            await fetchQuotes();
            closeModal();
        } catch (error) {
            console.error('Failed to update discounts:', error);
            setError(`Failed to update discounts: ${(error as Error).message}`);
        }
    };

    const convertToPurchaseOrder = async (quote: Quote) => {
        if (!finalDiscount.value) {
            setError('Final discount is required for purchase order conversion');
            return;
        }

        try {
            // First update the quote with final discount
            await fetch(`/api/quotes/edit?quote_id=${quote.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    final_discount_value: parseFloat(finalDiscount.value),
                    final_discount_type: finalDiscount.type
                }),
            });

            // Calculate final total
            const subtotal = quote.LineItems?.reduce((sum, item) => sum + Number(item.price), 0) || 0;
            let discount = 0;
            if (finalDiscount.type === 'percentage') {
                discount = subtotal * (parseFloat(finalDiscount.value) / 100);
            } else {
                discount = parseFloat(finalDiscount.value);
            }
            const finalTotal = subtotal - discount;

            // Send to external processing system
            const externalResponse = await fetch('http://blitz.cs.niu.edu/PurchaseOrder/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    order: `order-${Date.now()}`,
                    associate: quote.sales_associate_id,
                    custid: quote.customer_id.toString(),
                    amount: finalTotal.toFixed(2),
                }),
            });

            const result = await externalResponse.json();

            if (result.errors) {
                throw new Error(result.errors.join(', '));
            }

            // Update quote status to purchase order
            await fetch(`/api/quotes/edit?quote_id=${quote.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'UnprocessedPurchaseOrder'
                }),
            });

            alert(`Purchase Order processed successfully!\nProcessing Date: ${result.processDay}\nCommission Rate: ${result.commission}`);
            
            await fetchQuotes();
            setShowPurchaseOrderModal(false);
            setFinalDiscount({ value: '', type: 'percentage' });
        } catch (error) {
            console.error('Failed to convert to purchase order:', error);
            setError(`Failed to convert to purchase order: ${(error as Error).message}`);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DraftQuote':
                return styles.statusDraft;
            case 'FinalizedUnresolvedQuote':
                return styles.statusFinalized;
            case 'SanctionedQuote':
                return styles.statusSanctioned;
            case 'UnprocessedPurchaseOrder':
                return styles.statusPurchaseOrder;
            default:
                return styles.statusDraft;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'DraftQuote':
                return 'Draft';
            case 'FinalizedUnresolvedQuote':
                return 'Finalized';
            case 'SanctionedQuote':
                return 'Sanctioned';
            case 'UnprocessedPurchaseOrder':
                return 'Purchase Order';
            default:
                return status;
        }
    };

    const calculateTotal = (quote: Quote) => {
        if (!quote.LineItems) return 0;
        const subtotal = quote.LineItems.reduce((sum, item) => sum + Number(item.price), 0);
        
        let totalDiscount = 0;
        
        // Apply initial discount
        if (quote.initial_discount_value && quote.initial_discount_type) {
            if (quote.initial_discount_type === 'percentage') {
                totalDiscount += subtotal * (Number(quote.initial_discount_value) / 100);
            } else {
                totalDiscount += Number(quote.initial_discount_value);
            }
        }
        
        // Apply final discount
        if (quote.final_discount_value && quote.final_discount_type) {
            const discountBase = subtotal - (quote.initial_discount_value ? totalDiscount : 0);
            if (quote.final_discount_type === 'percentage') {
                totalDiscount += discountBase * (Number(quote.final_discount_value) / 100);
            } else {
                totalDiscount += Number(quote.final_discount_value);
            }
        }
        
        return Math.max(0, subtotal - totalDiscount);
    };

    if (isLoading) {
        return (
            <div className={styles.container}>
                <Background />
                <div className={styles.content}>
                    <div className={styles.welcomeCard}>
                        <div className={styles.loadingMessage}>Loading...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className={styles.container}>
                <Background />
                <div className={styles.content}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>Quote Management</h1>
                        <p className={styles.subtitle}>Access Denied</p>
                    </div>
                    <div className={styles.welcomeCard}>
                        <div className={styles.loginPrompt}>
                            <p>Please log in to access quote management.</p>
                            <Link href="/login" className={styles.loginLink}>
                                Login to Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!user.roles.is_quote_manager && !user.roles.is_admin) {
        return (
            <div className={styles.container}>
                <Background />
                <div className={styles.content}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>Quote Management</h1>
                        <p className={styles.subtitle}>Access Denied</p>
                    </div>
                    <div className={styles.welcomeCard}>
                        <div className={styles.loginPrompt}>
                            <p>You don't have permission to access quote management.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Background />
            <div className={styles.content}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Quote Management</h1>
                    <p className={styles.subtitle}>Review and sanction finalized quotes</p>
                </div>

                {error && (
                    <div className={styles.errorMessage}>
                        <p>{error}</p>
                    </div>
                )}

                {loading ? (
                    <div className={styles.welcomeCard}>
                        <div className={styles.loadingMessage}>Loading quotes...</div>
                    </div>
                ) : quotes.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>No quotes found.</p>
                    </div>
                ) : (
                    <div className={styles.quotesContainer}>
                        {quotes.map((quote) => (
                            <div key={quote.id} className={styles.quoteItem}>
                                <div className={styles.quoteHeader}>
                                    <h3 className={styles.quoteTitle}>
                                        Quote #{quote.id}
                                    </h3>
                                    <span className={`${styles.statusBadge} ${getStatusColor(quote.status)}`}>
                                        {getStatusLabel(quote.status)}
                                    </span>
                                </div>
                                
                                <div className={styles.quoteDetails}>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Customer Email:</span>
                                        {quote.email}
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Customer ID:</span>
                                        {quote.customer_id}
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Sales Associate:</span>
                                        {quote.SalesAssociate?.name || 'Unknown'}
                                    </div>
                                    {quote.initial_discount_value && (
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Initial Discount:</span>
                                            {quote.initial_discount_type === 'percentage' 
                                                ? `${quote.initial_discount_value}%` 
                                                : `$${Number(quote.initial_discount_value).toFixed(2)}`}
                                        </div>
                                    )}
                                    {quote.final_discount_value && (
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Final Discount:</span>
                                            {quote.final_discount_type === 'percentage' 
                                                ? `${quote.final_discount_value}%` 
                                                : `$${Number(quote.final_discount_value).toFixed(2)}`}
                                        </div>
                                    )}
                                </div>

                                {quote.LineItems && quote.LineItems.length > 0 && (
                                    <div className={styles.lineItemsSection}>
                                        <h4 className={styles.lineItemsTitle}>Line Items:</h4>
                                        {quote.LineItems.map((item) => (
                                            <div key={item.id} className={styles.lineItem}>
                                                {item.description}: ${Number(item.price).toFixed(2)}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className={styles.totalAmount}>
                                    Total: ${calculateTotal(quote).toFixed(2)}
                                </div>

                                <div className={styles.actionButtons}>
                                    <button
                                        onClick={() => openQuoteModal(quote)}
                                        className={styles.secondaryButton}
                                    >
                                        Edit Quote
                                    </button>
                                    {quote.status === 'FinalizedUnresolvedQuote' && (
                                        <button
                                            onClick={() => sanctionQuote(quote.id)}
                                            disabled={updatingQuote === quote.id}
                                            className={styles.primaryButton}
                                        >
                                            {updatingQuote === quote.id ? 'Sanctioning...' : 'Sanction Quote'}
                                        </button>
                                    )}
                                    {quote.status === 'DraftQuote' && (
                                        <button
                                            onClick={() => finalizeQuote(quote.id)}
                                            disabled={updatingQuote === quote.id}
                                            className={styles.secondaryButton}
                                        >
                                            {updatingQuote === quote.id ? 'Finalizing...' : 'Finalize Quote'}
                                        </button>
                                    )}
                                    {quote.status === 'SanctionedQuote' && (
                                        <button
                                            onClick={() => {
                                                setEditingQuote(quote);
                                                setShowPurchaseOrderModal(true);
                                            }}
                                            className={styles.primaryButton}
                                        >
                                            Convert to Purchase Order
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quote Edit Modal */}
            {showModal && editingQuote && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>Edit Quote #{editingQuote.id}</h2>
                            <button onClick={closeModal} className={styles.closeButton}>×</button>
                        </div>
                        
                        <div className={styles.modalBody}>
                            {/* Line Items Section */}
                            <div className={styles.section}>
                                <h3>Line Items</h3>
                                <div className={styles.lineItemsList}>
                                    {editingQuote.LineItems?.map((item) => (
                                        <div key={item.id} className={styles.lineItemRow}>
                                            {editingLineItem?.id === item.id ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        value={editingLineItem.description}
                                                        onChange={(e) => setEditingLineItem({
                                                            ...editingLineItem,
                                                            description: e.target.value
                                                        })}
                                                        className={styles.input}
                                                        placeholder="Description"
                                                    />
                                                    <input
                                                        type="number"
                                                        value={editingLineItem.price}
                                                        onChange={(e) => setEditingLineItem({
                                                            ...editingLineItem,
                                                            price: parseFloat(e.target.value)
                                                        })}
                                                        className={styles.input}
                                                        placeholder="Price"
                                                        step="0.01"
                                                    />
                                                    <button onClick={updateLineItem} className={styles.saveButton}>Save</button>
                                                    <button onClick={() => setEditingLineItem(null)} className={styles.cancelButton}>Cancel</button>
                                                </>
                                            ) : (
                                                <>
                                                    <span className={styles.itemDescription}>{item.description}</span>
                                                    <span className={styles.itemPrice}>${Number(item.price).toFixed(2)}</span>
                                                    <button
                                                        onClick={() => setEditingLineItem(item)}
                                                        className={styles.editButton}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => deleteLineItem(item.id)}
                                                        className={styles.deleteButton}
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Add New Line Item */}
                                <div className={styles.addLineItem}>
                                    <input
                                        type="text"
                                        value={newLineItem.description}
                                        onChange={(e) => setNewLineItem({
                                            ...newLineItem,
                                            description: e.target.value
                                        })}
                                        className={styles.input}
                                        placeholder="New item description"
                                    />
                                    <input
                                        type="number"
                                        value={newLineItem.price}
                                        onChange={(e) => setNewLineItem({
                                            ...newLineItem,
                                            price: e.target.value
                                        })}
                                        className={styles.input}
                                        placeholder="Price"
                                        step="0.01"
                                    />
                                    <button onClick={addLineItem} className={styles.addButton}>Add Item</button>
                                </div>
                            </div>

                            {/* Initial Discount Section */}
                            <div className={styles.section}>
                                <h3>Initial Discount</h3>
                                <div className={styles.discountRow}>
                                    <input
                                        type="number"
                                        value={initialDiscount.value}
                                        onChange={(e) => setInitialDiscount({
                                            ...initialDiscount,
                                            value: e.target.value
                                        })}
                                        className={styles.input}
                                        placeholder="Discount value"
                                        step="0.01"
                                    />
                                    <select
                                        value={initialDiscount.type}
                                        onChange={(e) => setInitialDiscount({
                                            ...initialDiscount,
                                            type: e.target.value
                                        })}
                                        className={styles.select}
                                    >
                                        <option value="percentage">Percentage</option>
                                        <option value="amount">Fixed Amount</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div className={styles.modalActions}>
                            <button onClick={updateQuoteDiscounts} className={styles.primaryButton}>
                                Save Changes
                            </button>
                            <button onClick={closeModal} className={styles.secondaryButton}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Purchase Order Modal */}
            {showPurchaseOrderModal && editingQuote && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>Convert to Purchase Order</h2>
                            <button 
                                onClick={() => setShowPurchaseOrderModal(false)} 
                                className={styles.closeButton}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className={styles.modalBody}>
                            <div className={styles.section}>
                                <h3>Quote #{editingQuote.id}</h3>
                                <p>Customer: {editingQuote.email}</p>
                                <p>Current Total: ${calculateTotal(editingQuote).toFixed(2)}</p>
                            </div>
                            
                            <div className={styles.section}>
                                <h3>Final Discount (Required)</h3>
                                <div className={styles.discountRow}>
                                    <input
                                        type="number"
                                        value={finalDiscount.value}
                                        onChange={(e) => setFinalDiscount({
                                            ...finalDiscount,
                                            value: e.target.value
                                        })}
                                        className={styles.input}
                                        placeholder="Final discount value"
                                        step="0.01"
                                        required
                                    />
                                    <select
                                        value={finalDiscount.type}
                                        onChange={(e) => setFinalDiscount({
                                            ...finalDiscount,
                                            type: e.target.value
                                        })}
                                        className={styles.select}
                                    >
                                        <option value="percentage">Percentage</option>
                                        <option value="amount">Fixed Amount</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div className={styles.modalActions}>
                            <button 
                                onClick={() => convertToPurchaseOrder(editingQuote)} 
                                className={styles.primaryButton}
                                disabled={!finalDiscount.value}
                            >
                                Convert to Purchase Order
                            </button>
                            <button 
                                onClick={() => setShowPurchaseOrderModal(false)} 
                                className={styles.secondaryButton}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}