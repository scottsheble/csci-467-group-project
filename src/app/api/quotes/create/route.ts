import { internal_db, QuoteAttributes } from "@/models/internal/db";
import { dbManager } from "@/lib/database";
import { NextResponse } from "next/server";
import propagate from "@/lib/propagate";

/****
    * Creates a new quote in the internal database.
    *
    * Expected HTTP Method: POST
    * Expected Query Parameters: None
    * Expected JSON Body:
    * - `email`: Required. Email address for the quote.
    * - `customer_id`: Required. ID of the customer for this quote.
    * 
    * Example Usage:
    * ```Next.js
    * const response = await fetch('/api/quotes/create', {
    *   method: 'POST',
    *   headers: { 'Content-Type': 'application/json' },
    *   body: JSON.stringify({
    *     email: 'customer@example.com',
    *     customer_id: 123
    *   })
    * });
    * const quote = await response.json();
    * ```
    */
export async function POST (
    request: Request
): Promise<NextResponse<QuoteAttributes[] | { error: string }>> {
    try {
        await dbManager.ensureInternalDbInitialized();

        // Unpack the request JSON body
        const quote_json = await request.json();
        const quote_email:       string = propagate(quote_json.email, 'Missing `email` in request!');
        const quote_customer_id: number = propagate(quote_json.customer_id, 'Missing `customer_id` in request!');

        // Create the quote in the internal database
        const quote = await propagate(internal_db.Quote, "Quote not initialized!")
            .create({
                email: quote_email,
                customer_id: quote_customer_id,
                status: 'DraftQuote' // Set default status
            });

        return NextResponse.json(quote, { status: 201 });
    } catch (err) {
        console.log('ERROR: API - ', (err as Error).message);

        return NextResponse.json({
            error: (err as Error).message,
        }, { status: 500 });
    }
}