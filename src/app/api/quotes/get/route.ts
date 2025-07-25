import { internal_db, QuoteAttributes } from "@/models/internal/db";
import { dbManager } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";
import propagate from "@/lib/propagate";

/****
    * Gets one or all quotes from the internal database.
    *
    * Expected HTTP Method: GET
    * Expected Query Parameters:
    * - `quote_id`: Optional. If provided, fetches the specific quote by ID.
    * Expected JSON Body: None
    * 
    * Example Usage:
    * ```Next.js
    * // Get all quotes
    * const response = await fetch('/api/quotes/get');
    * const quotes = await response.json();
    * 
    * // Get specific quote
    * const response = await fetch('/api/quotes/get?quote_id=123');
    * const quote = await response.json();
    * ```
    */
export async function GET (
    request: NextRequest
): Promise<NextResponse<QuoteAttributes[] | { error: string }>> {
    try {
        await dbManager.ensureInternalDbInitialized();

        // If quote_id is provided, fetch that specific quote,
        //  otherwise, fetch all quotes
        const quote_id = request.nextUrl.searchParams.get('quote_id');
        if ( quote_id ) {
            const quote = await propagate(internal_db.Quote, 'Quote model not initialized!')
                .findByPk(quote_id, {
                    include: [
                        { association: 'LineItems' },
                        { association: 'SecretNotes', order: [['createdAt', 'DESC']] }
                    ]
                });

            if (!quote) {
                return NextResponse.json({
                    error: `Quote with ID ${quote_id} not found`
                }, { status: 404 });
            }

            return NextResponse.json(quote);
        }

        // Otherwise, fetch all quotes
        const quotes = await propagate(
            internal_db.Quote,
            'Quote model not initialized!'
        ).findAll({
            include: [
                { association: 'LineItems' },
                { association: 'SecretNotes', order: [['createdAt', 'DESC']] }
            ]
        });

        return NextResponse.json(quotes);
    } catch (err) {
        console.log('ERROR: API - ', (err as Error).message);

        return NextResponse.json({
            error: (err as Error).message,
        }, { status: 500 });
    }
}