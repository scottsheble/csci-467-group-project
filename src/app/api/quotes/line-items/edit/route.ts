import { internal_db, QuoteAttributes } from "@/models/internal/db";
import { dbManager } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";
import propagate from "@/lib/propagate";

/****
    * Updates an existing line item in the internal database.
    *
    * Expected HTTP Method: PATCH
    * Expected Query Parameters:
    * - `line_item_id`: Required. ID of the line item to update.
    * Expected JSON Body (at least one required):
    * - `price`: Optional. New price for the line item.
    * - `description`: Optional. New description for the line item.
    * 
    * Example Usage:
    * ```Next.js
    * const response = await fetch('/api/quotes/line-items/edit?line_item_id=456', {
    *   method: 'PATCH',
    *   headers: { 'Content-Type': 'application/json' },
    *   body: JSON.stringify({
    *     price: 39.99,
    *     description: 'Updated product description'
    *   })
    * });
    * const updatedLineItem = await response.json();
    * ```
    */
export async function PATCH (
    request: NextRequest
): Promise<NextResponse<QuoteAttributes[] | { error: string }>> {
    try {
        await dbManager.ensureInternalDbInitialized();

        // Unpack query parameters
        const line_item_id = propagate(
            request.nextUrl.searchParams.get('line_item_id'),
            'Missing `line_item_id` in request!');

        // Unpack the request JSON body
        const line_item_json = await request.json();
        if ( !line_item_json.price && !line_item_json.description ) {
            return NextResponse.json({
                error: 'At least one of `price` or `description` must be provided!'
            }, { status: 400 });
        }

        // Check that the quote exists
        // Check that the line item exists
        propagate(
            await internal_db.LineItem?.findOne({ where: { id: line_item_id } }),
            `LineItem ${line_item_id} not found!`);

        // Edit the line item in the internal database
        await propagate(internal_db.LineItem, "LineItem not initialized!")
            .update({
                price:       line_item_json.price,
                description: line_item_json.description
            }, {
                where: { id: line_item_id }
            });
        
        // Fetch the updated line item
        const update_line_item = await propagate(
            internal_db.LineItem?.findOne({ where: { id: line_item_id } }),
            `LineItem ${line_item_id} not found!`);

        return NextResponse.json(update_line_item, { status: 200 });
    } catch (err) {
        console.log('ERROR: API - ', (err as Error).message);

        return NextResponse.json({
            error: (err as Error).message,
        }, { status: 500 });
    }
}