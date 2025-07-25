import { internal_db, QuoteAttributes } from "@/models/internal/db";
import { dbManager } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";
import propagate from "@/lib/propagate";

/****
    * Creates a new line item for a quote in the internal database.
    *
    * Expected HTTP Method: POST
    * Expected Query Parameters:
    * - `quote_id`: Required. ID of the quote to add the line item to.
    * Expected JSON Body:
    * - `price`: Required. Price of the line item.
    * - `description`: Required. Description of the line item.
    * 
    * Example Usage:
    * ```Next.js
    * const response = await fetch('/api/quotes/line-items/create?quote_id=123', {
    *   method: 'POST',
    *   headers: { 'Content-Type': 'application/json' },
    *   body: JSON.stringify({
    *     price: 29.99,
    *     description: 'Product description'
    *   })
    * });
    * const lineItem = await response.json();
    * ```
    */
export async function POST (
    request: NextRequest
): Promise<NextResponse<QuoteAttributes[] | { error: string }>> {
    try {
        await dbManager.ensureInternalDbInitialized();

        // Check that the `quote_id` was provided and exists
        const quote_id = propagate(
            request.nextUrl.searchParams.get('quote_id'),
            'Missing `quote_id` in request!');
        propagate(
            await internal_db.Quote?.findOne({ where: { id: quote_id } }),
            `Quote ${quote_id} not found!`);

        // Unpack the request JSON body
        const line_item_json = await request.json();
        const line_item_price:       number = propagate(line_item_json.price, 'Missing `price` in request');
        const line_item_description: string = propagate(line_item_json.description, 'Missing `description` in request!');

        // Create the line item in the internal database
        const line_item = await propagate(internal_db.LineItem, "LineItem not initialized!").create({
            quoteId:     quote_id,
            price:       line_item_price,
            description: line_item_description
        });

        return NextResponse.json(line_item, { status: 201 });
    } catch (err) {
        console.log('ERROR: API - ', (err as Error).message);

        return NextResponse.json({
            error: (err as Error).message,
        }, { status: 500 });
    }
}