import { internal_db, QuoteAttributes } from "@/models/internal/db";
import { dbManager } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";
import propagate from "@/lib/propagate";
import { withAuth, requireSalesAssociate } from "@/lib/auth-middleware";

/****
    * Creates a new quote in the internal database.
    *
    * Expected HTTP Method: POST
    * Expected Query Parameters: None
    * Expected JSON Body:
    * - `email`: Required. Email address for the quote.
    * - `customer_id`: Required. ID of the customer for this quote.
    * - `sales_associate_id`: Optional. ID of the sales associate for this quote.
    * - `initial_discount_value`: Optional. Initial discount value (number).
    * - `initial_discount_type`: Optional. Initial discount type ('percentage' or 'amount').
    * - `final_discount_value`: Optional. Final discount value (number).
    * - `final_discount_type`: Optional. Final discount type ('percentage' or 'amount').
    * 
    * Example Usage:
    * ```Next.js
    * const response = await fetch('/api/quotes/create', {
    *   method: 'POST',
    *   headers: { 'Content-Type': 'application/json' },
    *   body: JSON.stringify({
    *     email: 'customer@example.com',
    *     customer_id: 123,
    *     sales_associate_id: 456,
    *     initial_discount_value: 10,
    *     initial_discount_type: 'percentage',
    *     final_discount_value: 50,
    *     final_discount_type: 'amount'
    *   })
    * });
    * const quote = await response.json();
    * ```
    */
export const POST = withAuth(async (
    request: NextRequest,
    user
): Promise<NextResponse<QuoteAttributes[] | { error: string }>> => {
    try {
        await dbManager.ensureInternalDbInitialized();

        // Unpack the request JSON body
        const quote_json = await request.json();
        const quote_email:       string = propagate(quote_json.email, 'Missing `email` in request!');
        const quote_customer_id: number = propagate(quote_json.customer_id, 'Missing `customer_id` in request!');

        // Extract optional fields
        let sales_associate_id = quote_json.sales_associate_id || null;
        
        // Auto-assign sales associate if user is a sales associate and none specified
        if (!sales_associate_id && user.roles.is_sales_associate) {
            sales_associate_id = user.userId;
        }
        
        // Only admins can assign quotes to other sales associates
        if (sales_associate_id && sales_associate_id !== user.userId && !user.roles.is_admin) {
            return NextResponse.json({
                error: 'You can only create quotes for yourself'
            }, { status: 403 });
        }
        
        const initial_discount_value = quote_json.initial_discount_value || null;
        const initial_discount_type = quote_json.initial_discount_type || null;
        const final_discount_value = quote_json.final_discount_value || null;
        const final_discount_type = quote_json.final_discount_type || null;

        // Validate sales associate exists if provided
        if (sales_associate_id) {
            const salesAssociate = await propagate(internal_db.Employee, "Employee not initialized!")
                .findByPk(sales_associate_id);
            if (!salesAssociate) {
                throw new Error(`Sales associate with ID ${sales_associate_id} not found!`);
            }
        }

        // Validate discount types if provided
        if (initial_discount_type && !['percentage', 'amount'].includes(initial_discount_type)) {
            throw new Error('initial_discount_type must be either "percentage" or "amount"');
        }
        if (final_discount_type && !['percentage', 'amount'].includes(final_discount_type)) {
            throw new Error('final_discount_type must be either "percentage" or "amount"');
        }

        // Create the quote in the internal database
        const quote = await propagate(internal_db.Quote, "Quote not initialized!")
            .create({
                email: quote_email,
                customer_id: quote_customer_id,
                status: 'DraftQuote', // Set default status
                sales_associate_id,
                initial_discount_value,
                initial_discount_type,
                final_discount_value,
                final_discount_type
            });

        return NextResponse.json(quote, { status: 201 });
    } catch (err) {
        console.log('ERROR: API - ', (err as Error).message);

        return NextResponse.json({
            error: (err as Error).message,
        }, { status: 500 });
    }
}, requireSalesAssociate);