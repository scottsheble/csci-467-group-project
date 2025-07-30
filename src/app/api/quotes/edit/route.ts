import { internal_db, QuoteAttributes } from "@/models/internal/db";
import { dbManager } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";
import propagate from "@/lib/propagate";
import { withAuth, requireAnyRole } from "@/lib/auth-middleware";

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
    * - `sales_associate_id`: Optional. New sales associate ID for the quote.
    * - `initial_discount_value`: Optional. Initial discount value (number).
    * - `initial_discount_type`: Optional. Initial discount type ('percentage' or 'amount').
    * - `final_discount_value`: Optional. Final discount value (number).
    * - `final_discount_type`: Optional. Final discount type ('percentage' or 'amount').
    * 
    * Example Usage:
    * ```Next.js
    * const response = await fetch('/api/quotes/edit?quote_id=123', {
    *   method: 'PATCH',
    *   headers: { 'Content-Type': 'application/json' },
    *   body: JSON.stringify({
    *     email: 'newemail@example.com',
    *     status: 'FinalizedUnresolvedQuote',
    *     sales_associate_id: 456,
    *     initial_discount_value: 15,
    *     initial_discount_type: 'percentage'
    *   })
    * });
    * const updatedQuote = await response.json();
    * ```
    */
export const PATCH = withAuth(async (
    request: NextRequest,
    user
): Promise<NextResponse<QuoteAttributes[] | { error: string }>> => {
    try {
        await dbManager.ensureInternalDbInitialized();

        // Get the quote ID from the request URL and ensure it exists
        const quote_id = propagate(
            request.nextUrl.searchParams.get('quote_id'),
            'Missing `quote_id` in request!');
        
        const existingQuote = propagate(
            await internal_db.Quote?.findByPk(quote_id),
            `Quote with ID ${quote_id} not found!`);

        // Check permissions based on quote status and user role
        if (user.roles.is_sales_associate && !user.roles.is_admin) {
            // Sales associates can only edit their own quotes
            if (existingQuote.sales_associate_id !== user.userId) {
                return NextResponse.json({
                    error: 'You can only edit your own quotes'
                }, { status: 403 });
            }
            
            // Sales associates can only edit draft quotes
            if (existingQuote.status !== 'DraftQuote') {
                return NextResponse.json({
                    error: 'You can only edit draft quotes'
                }, { status: 403 });
            }
        }

        // Unpack the request JSON body
        const quote_json = await request.json();
        if ( !quote_json.email && !quote_json.customer_id && !quote_json.status && !quote_json.sales_associate_id &&
             quote_json.initial_discount_value === undefined && quote_json.initial_discount_type === undefined &&
             quote_json.final_discount_value === undefined && quote_json.final_discount_type === undefined ) {
            throw new Error('At least one of `email`, `customer_id`, `status`, `sales_associate_id`, `initial_discount_value`, `initial_discount_type`, `final_discount_value`, or `final_discount_type` must be provided!');
        }

        // Status change permissions
        if (quote_json.status !== undefined) {
            const currentStatus = existingQuote.status;
            const newStatus = quote_json.status;
            
            // Sales associates can only finalize their own quotes
            if (user.roles.is_sales_associate && !user.roles.is_admin) {
                if (currentStatus === 'DraftQuote' && newStatus === 'FinalizedUnresolvedQuote') {
                    // Allowed
                } else {
                    return NextResponse.json({
                        error: 'Sales associates can only finalize draft quotes'
                    }, { status: 403 });
                }
            }
            
            // Quote managers can sanction finalized quotes
            if (user.roles.is_quote_manager || user.roles.is_admin) {
                if (newStatus === 'SanctionedQuote' && currentStatus !== 'FinalizedUnresolvedQuote') {
                    return NextResponse.json({
                        error: 'Can only sanction finalized quotes'
                    }, { status: 400 });
                }
            }
            
            // Purchase managers can create purchase orders from sanctioned quotes
            if (user.roles.is_purchase_manager || user.roles.is_admin) {
                if (newStatus === 'UnprocessedPurchaseOrder' && currentStatus !== 'SanctionedQuote') {
                    return NextResponse.json({
                        error: 'Can only create purchase orders from sanctioned quotes'
                    }, { status: 400 });
                }
            }
        }

        // Validate sales associate exists if provided
        if (quote_json.sales_associate_id !== undefined && quote_json.sales_associate_id !== null) {
            const salesAssociate = await propagate(internal_db.Employee, "Employee not initialized!")
                .findByPk(quote_json.sales_associate_id);
            if (!salesAssociate) {
                throw new Error(`Sales associate with ID ${quote_json.sales_associate_id} not found!`);
            }
        }

        // Validate discount types if provided
        if (quote_json.initial_discount_type !== undefined && quote_json.initial_discount_type !== null && 
            !['percentage', 'amount'].includes(quote_json.initial_discount_type)) {
            throw new Error('initial_discount_type must be either "percentage" or "amount"');
        }
        if (quote_json.final_discount_type !== undefined && quote_json.final_discount_type !== null && 
            !['percentage', 'amount'].includes(quote_json.final_discount_type)) {
            throw new Error('final_discount_type must be either "percentage" or "amount"');
        }

        // Build update object with only provided fields
        const updateData: any = {};
        if (quote_json.email !== undefined) updateData.email = quote_json.email;
        if (quote_json.customer_id !== undefined) updateData.customer_id = quote_json.customer_id;
        if (quote_json.status !== undefined) updateData.status = quote_json.status;
        if (quote_json.sales_associate_id !== undefined) updateData.sales_associate_id = quote_json.sales_associate_id;
        if (quote_json.initial_discount_value !== undefined) updateData.initial_discount_value = quote_json.initial_discount_value;
        if (quote_json.initial_discount_type !== undefined) updateData.initial_discount_type = quote_json.initial_discount_type;
        if (quote_json.final_discount_value !== undefined) updateData.final_discount_value = quote_json.final_discount_value;
        if (quote_json.final_discount_type !== undefined) updateData.final_discount_type = quote_json.final_discount_type;

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
}, requireAnyRole);