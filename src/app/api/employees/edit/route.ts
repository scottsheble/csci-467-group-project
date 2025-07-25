import { internal_db, EmployeeAttributes } from "@/models/internal/db";
import { dbManager } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";
import propagate from "@/lib/propagate";

/****
    * Updates an existing employee in the internal database.
    *
    * Expected HTTP Method: PATCH
    * Expected Query Parameters:
    * - `employee_id`: Required. ID of the employee to update.
    * Expected JSON Body (at least one required):
    * - `name`: Optional. New name for the employee.
    * - `email`: Optional. New email address for the employee.
    * - `password`: Optional. New password for the employee.
    * - `address`: Optional. New address for the employee.
    * - `accumulated_commission`: Optional. New commission amount.
    * - `is_sales_associate`: Optional. New sales associate status.
    * - `is_quote_manager`: Optional. New quote manager status.
    * - `is_purchase_manager`: Optional. New purchase manager status.
    * - `is_admin`: Optional. New admin status.
    * 
    * Example Usage:
    * ```Next.js
    * const response = await fetch('/api/employees/edit?employee_id=123', {
    *   method: 'PATCH',
    *   headers: { 'Content-Type': 'application/json' },
    *   body: JSON.stringify({
    *     name: 'John Smith',
    *     accumulated_commission: 1500.00,
    *     is_quote_manager: true
    *   })
    * });
    * const updatedEmployee = await response.json();
    * ```
    */
export async function PATCH (
    request: NextRequest
): Promise<NextResponse<EmployeeAttributes | { error: string }>> {
    try {
        await dbManager.ensureInternalDbInitialized();

        // Get the employee ID from the request URL and ensure it exists
        const employee_id = propagate(
            request.nextUrl.searchParams.get('employee_id'),
            'Missing `employee_id` in request!');
        
        const existingEmployee = await propagate(internal_db.Employee, "Employee not initialized!")
            .findByPk(employee_id);
        
        if (!existingEmployee) {
            return NextResponse.json({
                error: `Employee with ID ${employee_id} not found!`
            }, { status: 404 });
        }

        // Unpack the request JSON body
        const employee_json = await request.json();
        const hasUpdates = Object.keys(employee_json).some(key => 
            ['name', 'email', 'password', 'address', 'accumulated_commission', 
             'is_sales_associate', 'is_quote_manager', 'is_purchase_manager', 'is_admin'].includes(key)
        );

        if (!hasUpdates) {
            throw new Error('At least one valid field must be provided for update!');
        }

        // Build update object with only provided fields
        const updateData: any = {};
        if (employee_json.name !== undefined) updateData.name = employee_json.name;
        if (employee_json.email !== undefined) updateData.email = employee_json.email;
        if (employee_json.password !== undefined) updateData.password = employee_json.password;
        if (employee_json.address !== undefined) updateData.address = employee_json.address;
        if (employee_json.accumulated_commission !== undefined) updateData.accumulated_commission = employee_json.accumulated_commission;
        if (employee_json.is_sales_associate !== undefined) updateData.is_sales_associate = employee_json.is_sales_associate;
        if (employee_json.is_quote_manager !== undefined) updateData.is_quote_manager = employee_json.is_quote_manager;
        if (employee_json.is_purchase_manager !== undefined) updateData.is_purchase_manager = employee_json.is_purchase_manager;
        if (employee_json.is_admin !== undefined) updateData.is_admin = employee_json.is_admin;

        // Update the employee in the internal database
        await propagate(internal_db.Employee, "Employee not initialized!")
            .update(updateData, {
                where: { id: employee_id }
            });
        
        // Fetch the updated employee
        const updated_employee = await propagate(internal_db.Employee, "Employee not initialized!")
            .findByPk(employee_id);

        if (!updated_employee) {
            return NextResponse.json({
                error: `Employee with ID ${employee_id} not found after update`
            }, { status: 404 });
        }

        return NextResponse.json(updated_employee, { status: 200 });
    } catch (err) {
        console.log('ERROR: API - ', (err as Error).message);

        return NextResponse.json({
            error: (err as Error).message,
        }, { status: 500 });
    }
}
