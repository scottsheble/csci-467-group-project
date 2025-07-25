import { internal_db, EmployeeAttributes } from "@/models/internal/db";
import { dbManager } from "@/lib/database";
import { NextResponse } from "next/server";
import propagate from "@/lib/propagate";

/****
    * Creates a new employee in the internal database.
    *
    * Expected HTTP Method: POST
    * Expected Query Parameters: None
    * Expected JSON Body:
    * - `name`: Required. Name of the employee.
    * - `email`: Required. Email address of the employee.
    * - `password`: Required. Password for the employee.
    * - `address`: Required. Address of the employee.
    * - `accumulated_commission`: Optional. Initial commission amount (defaults to 0).
    * - `is_sales_associate`: Optional. Whether the employee is a sales associate (defaults to false).
    * - `is_quote_manager`: Optional. Whether the employee is a quote manager (defaults to false).
    * - `is_purchase_manager`: Optional. Whether the employee is a purchase manager (defaults to false).
    * - `is_admin`: Optional. Whether the employee is an admin (defaults to false).
    * 
    * Example Usage:
    * ```Next.js
    * const response = await fetch('/api/employees/create', {
    *   method: 'POST',
    *   headers: { 'Content-Type': 'application/json' },
    *   body: JSON.stringify({
    *     name: 'John Doe',
    *     email: 'john.doe@company.com',
    *     password: 'password123',
    *     address: '123 Main St, City, State 12345',
    *     is_sales_associate: true
    *   })
    * });
    * const employee = await response.json();
    * ```
    */
export async function POST (
    request: Request
): Promise<NextResponse<EmployeeAttributes | { error: string }>> {
    try {
        await dbManager.ensureInternalDbInitialized();

        // Unpack the request JSON body
        const employee_json = await request.json();
        const name: string = propagate(employee_json.name, 'Missing `name` in request!');
        const email: string = propagate(employee_json.email, 'Missing `email` in request!');
        const password: string = propagate(employee_json.password, 'Missing `password` in request!');
        const address: string = propagate(employee_json.address, 'Missing `address` in request!');

        // Extract optional fields with defaults
        const accumulated_commission = employee_json.accumulated_commission || 0;
        const is_sales_associate = employee_json.is_sales_associate || false;
        const is_quote_manager = employee_json.is_quote_manager || false;
        const is_purchase_manager = employee_json.is_purchase_manager || false;
        const is_admin = employee_json.is_admin || false;

        // Create the employee in the internal database
        const employee = await propagate(internal_db.Employee, "Employee not initialized!")
            .create({
                name,
                email,
                password,
                address,
                accumulated_commission,
                is_sales_associate,
                is_quote_manager,
                is_purchase_manager,
                is_admin
            });

        return NextResponse.json(employee, { status: 201 });
    } catch (err) {
        console.log('ERROR: API - ', (err as Error).message);

        return NextResponse.json({
            error: (err as Error).message,
        }, { status: 500 });
    }
}
