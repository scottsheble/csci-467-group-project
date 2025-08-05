'use client';
import { useEffect, useState } from 'react';
import Background from '@/components/background';
import styles from '@/styles/purchase-order-manager.module.css';

type Quote = {
  id: number;
  customer_id: number;
  customer_name: string,
  email: string;
  total: number;
  status: string;
  sales_associate_id: number;
};

export default function PurchaseOrderManager() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [discount, setDiscount] = useState<number>(0);
  const [error, setError] = useState('');

const fetchQuotes = async () => {
  try {
    const res = await fetch('/api/quotes/get?status=SanctionedQuote');
    const data = await res.json();

    const patched = data.map((q: any) => {
      const total = Array.isArray(q.LineItems)
        ? q.LineItems.reduce((sum: number, item: any) => sum + Number(item.price || 0), 0)
        : 0;

      return {
        ...q,
        total,
      };
    });

    setQuotes(patched);
  } catch (err) {
    console.error(err);
    setError('Failed to load quotes.');
  }
};

  useEffect(() => {
    fetchQuotes();
  }, []);

  const handleSubmit = async () => {
    if (!selectedQuote) return;
    const discountedTotal = selectedQuote.total - discount;

    const payload = {
      order: `order-${Date.now()}`,
      associate: selectedQuote.sales_associate_id,
      custid: selectedQuote.customer_id.toString(),
      amount: discountedTotal.toFixed(2),
    };

    try {
      const res = await fetch('http://blitz.cs.niu.edu/PurchaseOrder/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.errors) {
        setError(result.errors.join(', '));
      } else {
        alert(
          `Order processed on ${result.processDay} with ${result.commission} commission`
        );

        await fetch('/api/quotes/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quoteId: selectedQuote.id,
            finalDiscount: discount,
            finalTotal: discountedTotal,
            processDate: result.processDay,
            commissionRate: result.commission,
          }),
        });

        //patch post processing
        await fetch(`/api/quotes/edit?quote_id=${selectedQuote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'UnprocessedPurchaseOrder' }),
      });

      // Refresh quotes after successful order
      fetchQuotes();
      }
    } catch (err) {
      setError('Error sending request to Blitz system.');
    }
  };

  return (
    <div className={styles.container}>
      <Background />
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>Purchase Order Management</h1>
          <p className={styles.subtitle}>Process sanctioned quotes through the Blitz system</p>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <p>{error}</p>
          </div>
        )}

        <div className={`${styles.mainGrid} ${!selectedQuote ? styles.singleColumn : ''}`}>
          {/* Sanctioned Quotes Section */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Sanctioned Quotes</h2>
              <button
                className={styles.refreshButton}
                onClick={fetchQuotes}
              >
                Refresh Quotes
              </button>
            </div>

            {quotes.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No sanctioned quotes available.</p>
              </div>
            ) : (
              <div className={styles.quotesList}>
                {quotes.map((quote) => (
                  <div 
                    key={quote.id} 
                    className={`${styles.quoteItem} ${selectedQuote?.id === quote.id ? styles.selected : ''}`}
                    onClick={() => setSelectedQuote(quote)}
                  >
                    <label className={styles.quoteLabel}>
                      <input
                        type="radio"
                        name="quote"
                        value={quote.id}
                        checked={selectedQuote?.id === quote.id}
                        onChange={() => setSelectedQuote(quote)}
                        className={styles.radioInput}
                      />
                      <div className={styles.quoteDetails}>
                        <span className={styles.quoteNumber}>Quote #{quote.id}</span>
                        <span className={styles.customerInfo}> | Customer #{quote.customer_id}</span>
                        <span className={styles.totalAmount}> | ${quote.total.toFixed(2)}</span>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quote Submission Section */}
          {selectedQuote && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  Submit Quote #{selectedQuote.id} to Blitz
                </h2>
              </div>

              <div className={styles.submissionForm}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Final Discount ($):</label>
                  <input
                    type="number"
                    value={discount}
                    min={0}
                    max={selectedQuote.total}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className={styles.formInput}
                    placeholder="Enter discount amount"
                  />
                </div>

                <div className={styles.finalTotal}>
                  <span className={styles.finalTotalLabel}>Final Total:</span>
                  <span className={styles.finalTotalAmount}>
                    ${(selectedQuote.total - discount).toFixed(2)}
                  </span>
                </div>

                <button
                  className={styles.submitButton}
                  onClick={handleSubmit}
                  disabled={!selectedQuote}
                >
                  Submit to Blitz System
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}