import { internal_db, EmployeeAttributes } from "@/models/internal/db";
import { dbManager } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";
import propagate from "@/lib/propagate";
import { withAuth, requireAdmin } from "@/lib/auth-middleware";

/****
    * Gets employees from the internal database.
    *
    * Expected HTTP Method: GET
    * Expected Query Parameters:
    * - `employee_id`: Optional. ID of a specific employee to get.
    * - `is_sales_associate`: Optional. Filter by sales associates (true/false).
    * 
    * Example Usage:
    * ```Next.js
    * // Get all employees
    * const response = await fetch('/api/employees/get');
    * const employees = await response.json();
    * 
    * // Get specific employee
    * const response = await fetch('/api/employees/get?employee_id=123');
    * const employee = await response.json();
    * 
    * // Get all sales associates
    * const response = await fetch('/api/employees/get?is_sales_associate=true');
    * const salesAssociates = await response.json();
    * ```
    */
export const GET = withAuth(async (
    request: NextRequest,
    user
): Promise<NextResponse<EmployeeAttributes[] | EmployeeAttributes | { error: string }>> => {
    try {
        await dbManager.ensureInternalDbInitialized();

        const employee_id = request.nextUrl.searchParams.get('employee_id');
        const is_sales_associate = request.nextUrl.searchParams.get('is_sales_associate');

        // If employee_id is provided, get specific employee
        if (employee_id) {
            const employee = await propagate(internal_db.Employee, "Employee not initialized!")
                .findByPk(employee_id);
            
            if (!employee) {
                return NextResponse.json({
                    error: `Employee with ID ${employee_id} not found`
                }, { status: 404 });
            }

            return NextResponse.json(employee, { status: 200 });
        }

        // Build where clause for filtering
        const whereClause: any = {};
        if (is_sales_associate !== null) {
            whereClause.is_sales_associate = is_sales_associate === 'true';
        }

        // Get all employees with optional filtering
        const employees = await propagate(internal_db.Employee, "Employee not initialized!")
            .findAll({ where: whereClause });

        return NextResponse.json(employees, { status: 200 });
    } catch (err) {
        console.log('ERROR: API - ', (err as Error).message);

        return NextResponse.json({
            error: (err as Error).message,
        }, { status: 500 });
    }
}, requireAdmin);
