import { internal_db, QuoteAttributes } from "@/models/internal/db";
import { dbManager } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";
import propagate from "@/lib/propagate";

/****
    * Gets one or all line items from the internal database.
    *
    * Expected HTTP Method: GET
    * Expected Query Parameters:
    * - `line_item_id`: Optional. If provided, fetches the specific line item by ID.
    * - `quote_id`: Required if line_item_id not provided. Fetches all line items for the given quote.
    * Expected JSON Body: None
    * 
    * Example Usage:
    * ```Next.js
    * // Get specific line item
    * const response = await fetch('/api/quotes/line-items/get?line_item_id=456');
    * const lineItem = await response.json();
    * 
    * // Get all line items for a quote
    * const response = await fetch('/api/quotes/line-items/get?quote_id=123');
    * const lineItems = await response.json();
    * ```
    */
export async function GET (
    request: NextRequest
): Promise<NextResponse<QuoteAttributes[] | { error: string }>> {
    try {
        await dbManager.ensureInternalDbInitialized();

        // If line_item_id is provided, fetch that specific line item,
        //  otherwise, fetch all line items for the given quote
        const line_item_id = request.nextUrl.searchParams.get('line_item_id');
        if ( line_item_id ) {
            const line_item = propagate(
                await internal_db.LineItem?.findOne({ where: { id: line_item_id } }),
                `LineItem ${line_item_id} not found!`);

            return NextResponse.json(line_item);
        }

        // Otherwise, ensure `quote_id` is provided and exists
        const quote_id = propagate(
            request.nextUrl.searchParams.get('quote_id'),
            'Missing `quote_id` in request!');
        propagate(
            await internal_db.Quote?.findOne({ where: { id: quote_id } }),
            `Quote ${quote_id} not found!`);

        // Fetch all line items for the given quote
        const line_items = await propagate(internal_db.LineItem, "LineItem not initialized!")
            .findAll({
                where: { quoteId: quote_id }
            });

        return NextResponse.json(line_items, { status: 201 });
    } catch (err) {
        console.log('ERROR: API - ', (err as Error).message);

        return NextResponse.json({
            error: (err as Error).message,
        }, { status: 500 });
    }
}