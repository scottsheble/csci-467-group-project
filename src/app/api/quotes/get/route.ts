import { internal_db, QuoteAttributes } from "@/models/internal/db";
import { dbManager } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";
import propagate from "@/lib/propagate";
import { Op } from "sequelize";

/****
    * Gets one or all quotes from the internal database with optional filtering.
    *
    * Expected HTTP Method: GET
    * Expected Query Parameters:
    * - `quote_id`: Optional. If provided, fetches the specific quote by ID.
    * - `status`: Optional. Filter by quote status.
    * - `date_from`: Optional. Filter quotes created on or after this date (YYYY-MM-DD format).
    * - `date_to`: Optional. Filter quotes created on or before this date (YYYY-MM-DD format).
    * - `sales_associate_id`: Optional. Filter by sales associate ID.
    * - `customer_id`: Optional. Filter by customer ID.
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
    * 
    * // Get quotes with filters
    * const response = await fetch('/api/quotes/get?status=DraftQuote&sales_associate_id=456&date_from=2024-01-01');
    * const filteredQuotes = await response.json();
    * ```
    */
export async function GET (
    request: NextRequest
): Promise<NextResponse<QuoteAttributes[] | { error: string }>> {
    try {
        await dbManager.ensureInternalDbInitialized();

        // If quote_id is provided, fetch that specific quote,
        //  otherwise, fetch all quotes with optional filtering
        const quote_id = request.nextUrl.searchParams.get('quote_id');
        if ( quote_id ) {
            const quote = await propagate(internal_db.Quote, 'Quote model not initialized!')
                .findByPk(quote_id, {
                    include: [
                        { association: 'LineItems' },
                        { association: 'SecretNotes', order: [['createdAt', 'DESC']] },
                        { association: 'SalesAssociate' }
                    ]
                });

            if (!quote) {
                return NextResponse.json({
                    error: `Quote with ID ${quote_id} not found`
                }, { status: 404 });
            }

            return NextResponse.json(quote);
        }

        // Build where clause for filtering
        const whereClause: any = {};
        
        // Filter by status
        const status = request.nextUrl.searchParams.get('status');
        if (status) {
            whereClause.status = status;
        }

        // Filter by date range
        const date_from = request.nextUrl.searchParams.get('date_from');
        const date_to = request.nextUrl.searchParams.get('date_to');
        if (date_from || date_to) {
            whereClause.date_created = {};
            if (date_from) {
                const fromDate = new Date(date_from);
                if (isNaN(fromDate.getTime())) {
                    throw new Error('Invalid date_from format. Use YYYY-MM-DD.');
                }
                whereClause.date_created[Op.gte] = fromDate;
            }
            if (date_to) {
                const toDate = new Date(date_to);
                if (isNaN(toDate.getTime())) {
                    throw new Error('Invalid date_to format. Use YYYY-MM-DD.');
                }
                // Set to end of day
                toDate.setHours(23, 59, 59, 999);
                whereClause.date_created[Op.lte] = toDate;
            }
        }

        // Filter by sales associate
        const sales_associate_id = request.nextUrl.searchParams.get('sales_associate_id');
        if (sales_associate_id) {
            whereClause.sales_associate_id = sales_associate_id;
        }

        // Filter by customer
        const customer_id = request.nextUrl.searchParams.get('customer_id');
        if (customer_id) {
            whereClause.customer_id = customer_id;
        }

        // Otherwise, fetch all quotes with filtering
        const quotes = await propagate(
            internal_db.Quote,
            'Quote model not initialized!'
        ).findAll({
            where: whereClause,
            include: [
                { association: 'LineItems' },
                { association: 'SecretNotes', order: [['createdAt', 'DESC']] },
                { association: 'SalesAssociate' }
            ],
            order: [['date_created', 'DESC']]
        });

        return NextResponse.json(quotes);
    } catch (err) {
        console.log('ERROR: API - ', (err as Error).message);

        return NextResponse.json({
            error: (err as Error).message,
        }, { status: 500 });
    }
}