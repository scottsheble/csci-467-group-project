'use client';
import { useEffect, useState } from 'react';

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
      const patched = data.map((q: any) => ({
        ...q,
        total: q.total ?? 123.45,
      }));
      setQuotes(patched);
    } catch (err) {
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

        // Refresh quotes after successful order
        fetchQuotes();
      }
    } catch (err) {
      setError('Error sending request to Blitz system.');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Quote Purchase Manager</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="flex flex-col lg:flex-row gap-8">
        {}
        <div className="w-full lg:w-1/2">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Sanctioned Quotes</h2>
            <button
              className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              onClick={fetchQuotes}
            >
              Refresh Quotes
            </button>
          </div>

          {quotes.length === 0 ? (
            <p className="text-gray-600 italic">No sanctioned quotes available.</p>
          ) : (
            <ul className="space-y-2">
              {quotes.map((quote) => (
                <li key={quote.id} className="p-3 border rounded shadow-sm">
                  <label>
                    <input
                      type="radio"
                      name="quote"
                      value={quote.id}
                      onChange={() => setSelectedQuote(quote)}
                      className="mr-2"
                    />
                    Quote #{quote.id} | Customer #{quote.customer_id} | $
                    {quote.total.toFixed(2)}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        {}
        {selectedQuote && (
          <div className="w-full lg:w-1/2">
            <h2 className="text-lg font-semibold mb-2">
              Submit Quote #{selectedQuote.id} to Blitz
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Final Discount ($):</label>
                <input
                  type="number"
                  value={discount}
                  min={0}
                  max={selectedQuote.total}
                  onChange={(e) => setDiscount(parseFloat(e.target.value))}
                  className="w-full border px-2 py-1"
                />
              </div>

              <p>
                <strong>Final Total:</strong> $
                {(selectedQuote.total - discount).toFixed(2)}
              </p>

              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                onClick={handleSubmit}
              >
                Submit to Blitz
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}