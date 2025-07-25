import { internal_db } from "@/models/internal/db";
import { dbManager } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";
import propagate from "@/lib/propagate";

/****
    * Deletes an employee from the internal database.
    *
    * Expected HTTP Method: DELETE
    * Expected Query Parameters:
    * - `employee_id`: Required. ID of the employee to delete.
    * 
    * Example Usage:
    * ```Next.js
    * const response = await fetch('/api/employees/delete?employee_id=123', {
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

        // Check if employee has associated quotes
        const associatedQuotes = await propagate(internal_db.Quote, "Quote not initialized!")
            .findAll({ where: { sales_associate_id: employee_id } });

        if (associatedQuotes.length > 0) {
            return NextResponse.json({
                error: `Cannot delete employee ${employee_id} because they have ${associatedQuotes.length} associated quote(s). Update those quotes first.`
            }, { status: 400 });
        }

        // Delete the employee from the internal database
        await propagate(internal_db.Employee, "Employee not initialized!")
            .destroy({
                where: { id: employee_id }
            });

        return NextResponse.json({
            message: `Employee with ID ${employee_id} deleted successfully`
        }, { status: 200 });
    } catch (err) {
        console.log('ERROR: API - ', (err as Error).message);

        return NextResponse.json({
            error: (err as Error).message,
        }, { status: 500 });
    }
}
