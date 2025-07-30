import { legacy_db, LegacyCustomer } from "@/models/legacy/db";
import { dbManager } from "@/lib/database";
import propagate from "@/lib/propagate";
import { NextRequest, NextResponse } from "next/server";
import { withAuth, requireAnyRole } from "@/lib/auth-middleware";

/****
    * Gets one or all legacy customers from the legacy database.
    *
    * Expected HTTP Method: GET
    * Expected Query Parameters:
    * - `customer_id`: Optional. If provided, fetches the specific customer by ID.
    * Expected JSON Body: None
    * 
    * Example Usage:
    * ```Next.js
    * const response = await fetch('/api/customers?customer_id=123');
    * const customer = await response.json();
    * ```
    */
export const GET = withAuth(async (
    request: NextRequest,
    user
): Promise<NextResponse<LegacyCustomer[] | { error: string }>> => {
    try {
        await dbManager.ensureLegacyDbInitialized();

        // If the customer_id is provided, fetch that specific customer
        const customer_id = request.nextUrl.searchParams.get('customer_id');
        if ( customer_id ) {
            const legacy_customer = await propagate(
                legacy_db.LegacyCustomer?.findByPk(customer_id), 
                'Could not find customer with the given ID');

            return NextResponse.json(legacy_customer);
        }

        // Otherwise, fetch all legacy customers
        const legacy_customers = await propagate(
            legacy_db.LegacyCustomer?.findAll(),
            'LegacyCustomer model not initialized or no customers found'
        );
        return NextResponse.json(legacy_customers);
    } catch (err) {
        console.log('ERROR: API - ', (err as Error).message);

        return NextResponse.json({
            error: (err as Error).message,
        }, { status: 500 });
    }
}, requireAnyRole);