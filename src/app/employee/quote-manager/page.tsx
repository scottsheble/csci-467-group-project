"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';

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
                return 'bg-gray-100 text-gray-800';
            case 'FinalizedUnresolvedQuote':
                return 'bg-yellow-100 text-yellow-800';
            case 'SanctionedQuote':
                return 'bg-green-100 text-green-800';
            case 'UnprocessedPurchaseOrder':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
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
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
                    <p className="mb-4">Please log in to access quote management.</p>
                    <Link 
                        href="/login"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
                    >
                        Login
                    </Link>
                </div>
            </div>
        );
    }

    if (!user.roles.is_quote_manager && !user.roles.is_admin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
                    <p>You don't have permission to access quote management.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Quote Management</h1>
                <p className="text-gray-600">Review and sanction finalized quotes</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                    <p className="text-red-800">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="text-center py-8">
                    <div className="text-lg">Loading quotes...</div>
                </div>
            ) : quotes.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
                    <p className="text-gray-700">No quotes found.</p>
                </div>
            ) : (
                <>
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {quotes.map((quote) => (
                                <li key={quote.id} className="px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-lg font-medium text-gray-900">
                                                    Quote #{quote.id}
                                                </h3>
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(quote.status)}`}>
                                                    {getStatusLabel(quote.status)}
                                                </span>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                                                <div>
                                                    <span className="font-medium">Customer Email:</span> {quote.email}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Customer ID:</span> {quote.customer_id}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Sales Associate:</span> {quote.SalesAssociate?.name || 'Unknown'}
                                                </div>
                                            </div>

                                            {quote.LineItems && quote.LineItems.length > 0 && (
                                                <div className="mb-3">
                                                    <h4 className="font-medium text-gray-900 mb-2">Line Items:</h4>
                                                    <ul className="space-y-1">
                                                        {quote.LineItems.map((item) => (
                                                            <li key={item.id} className="text-sm text-gray-600">
                                                                {item.description}: ${Number(item.price).toFixed(2)}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            <div className="text-sm">
                                                <span className="font-medium">Total:</span> ${calculateTotal(quote).toFixed(2)}
                                            </div>
                                        </div>

                                        <div className="ml-6">
                                            {quote.status === 'FinalizedUnresolvedQuote' && (
                                                <button
                                                    onClick={() => sanctionQuote(quote.id)}
                                                    disabled={updatingQuote === quote.id}
                                                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm font-medium"
                                                >
                                                    {updatingQuote === quote.id ? 'Sanctioning...' : 'Sanction Quote'}
                                                </button>
                                            )}
                                            {quote.status === 'DraftQuote' && (
                                                <button
                                                    onClick={() => finalizeQuote(quote.id)}
                                                    disabled={updatingQuote === quote.id}
                                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm font-medium"
                                                >
                                                    {updatingQuote === quote.id ? 'Finalizing...' : 'Finalize Quote'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
}