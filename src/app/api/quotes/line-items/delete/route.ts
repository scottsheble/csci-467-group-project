import { internal_db } from "@/models/internal/db";
import { dbManager } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";
import propagate from "@/lib/propagate";

/****
    * Deletes an existing line item from the internal database.
    *
    * Expected HTTP Method: DELETE
    * Expected Query Parameters:
    * - `line_item_id`: Required. ID of the line item to delete.
    * Expected JSON Body: None
    * 
    * Example Usage:
    * ```Next.js
    * const response = await fetch('/api/quotes/line-items/delete?line_item_id=456', {
    *   method: 'DELETE'
    * });
    * const result = await response.json();
    * ```
    */
export async function DELETE (
    request: NextRequest
): Promise<NextResponse<{ message: string } | { error: string }>> {
    try {
        await dbManager.ensureInternalDbInitialized();

        const searchParams = request.nextUrl.searchParams;
        const line_item_id = searchParams.get('line_item_id');

        if (!line_item_id) {
            return NextResponse.json({
                error: 'Missing `line_item_id` parameter in request'
            }, { status: 400 });
        }

        // Find the line item to delete
        const lineItem = await propagate(internal_db.LineItem, "LineItem model not initialized!")
            .findByPk(parseInt(line_item_id));
        
        if (!lineItem) {
            return NextResponse.json({
                error: `Line item with ID ${line_item_id} not found`
            }, { status: 404 });
        }

        // Delete the line item
        await lineItem.destroy();

        return NextResponse.json({
            message: `Line item with ID ${line_item_id} deleted successfully`
        }, { status: 200 });
    } catch (err) {
        console.log('ERROR: API - ', (err as Error).message);

        return NextResponse.json({
            error: (err as Error).message,
        }, { status: 500 });
    }
}
