import { internal_db, QuoteAttributes } from "@/models/internal/db";
import { dbManager } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";
import propagate from "@/lib/propagate";

/****
    * Updates an existing quote in the internal database.
    *
    * Expected HTTP Method: PATCH
    * Expected Query Parameters:
    * - `quote_id`: Required. ID of the quote to update.
    * Expected JSON Body (at least one required):
    * - `email`: Optional. New email address for the quote.
    * - `customer_id`: Optional. New customer ID for the quote.
    * - `status`: Optional. New status for the quote.
    * 
    * Example Usage:
    * ```Next.js
    * const response = await fetch('/api/quotes/edit?quote_id=123', {
    *   method: 'PATCH',
    *   headers: { 'Content-Type': 'application/json' },
    *   body: JSON.stringify({
    *     email: 'newemail@example.com',
    *     status: 'FinalizedUnresolvedQuote'
    *   })
    * });
    * const updatedQuote = await response.json();
    * ```
    */
export async function PATCH (
    request: NextRequest
): Promise<NextResponse<QuoteAttributes[] | { error: string }>> {
    try {
        await dbManager.ensureInternalDbInitialized();

        // Get the quote ID from the request URL and ensure it exists
        const quote_id = propagate(
            request.nextUrl.searchParams.get('quote_id'),
            'Missing `quote_id` in request!');
        propagate(
            await internal_db.Quote?.findByPk(quote_id),
            `Quote with ID ${quote_id} not found!`);

        // Unpack the request JSON body
        const quote_json = await request.json();
        if ( !quote_json.email && !quote_json.customer_id && !quote_json.status ) {
            throw new Error('At least one of `email`, `customer_id`, or `status` must be provided!');
        }

        // Build update object with only provided fields
        const updateData: any = {};
        if (quote_json.email !== undefined) updateData.email = quote_json.email;
        if (quote_json.customer_id !== undefined) updateData.customer_id = quote_json.customer_id;
        if (quote_json.status !== undefined) updateData.status = quote_json.status;

        // Edit the quote in the internal database
        await propagate(internal_db.Quote, "Quote not initialized!")
            .update(updateData, {
                where: { id: quote_id }
            });
        
        // Fetch the updated quote with associations
        const updated_quote = await propagate(internal_db.Quote, "Quote not initialized!")
            .findByPk(quote_id, {
                include: [
                    { association: 'LineItems' },
                    { association: 'SecretNotes', order: [['createdAt', 'DESC']] }
                ]
            });

        if (!updated_quote) {
            return NextResponse.json({
                error: `Quote with ID ${quote_id} not found after update`
            }, { status: 404 });
        }

        return NextResponse.json(updated_quote, { status: 200 });
    } catch (err) {
        console.log('ERROR: API - ', (err as Error).message);

        return NextResponse.json({
            error: (err as Error).message,
        }, { status: 500 });
    }
}