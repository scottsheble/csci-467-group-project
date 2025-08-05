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
        
        let discount = 0;
        if (quote.final_discount_value && quote.final_discount_type) {
            if (quote.final_discount_type === 'percentage') {
                discount = subtotal * (Number(quote.final_discount_value) / 100);
            } else {
                discount = Number(quote.final_discount_value);
            }
        }
        
        return subtotal - discount;
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
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}