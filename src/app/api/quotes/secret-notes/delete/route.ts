import { internal_db } from "@/models/internal/db";
import { dbManager } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";
import propagate from "@/lib/propagate";

/****
    * Deletes an existing secret note from the internal database.
    *
    * Expected HTTP Method: DELETE
    * Expected Query Parameters:
    * - `id`: Required. ID of the secret note to delete.
    * Expected JSON Body: None
    * 
    * Example Usage:
    * ```Next.js
    * const response = await fetch('/api/quotes/secret-notes/delete?id=1', {
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

        // Check that the `id` was provided
        const id = propagate(
            request.nextUrl.searchParams.get('id'),
            'Missing `id` in request!');

        // Find the secret note to delete
        const secretNote = await propagate(internal_db.SecretNote, "SecretNote model not initialized!")
            .findByPk(id);
        
        if (!secretNote) {
            return NextResponse.json({
                error: `Secret note with ID ${id} not found`
            }, { status: 404 });
        }

        // Delete the secret note
        await secretNote.destroy();

        return NextResponse.json({
            message: `Secret note with ID ${id} has been deleted successfully`
        }, { status: 200 });
    } catch (err) {
        console.log('ERROR: API - ', (err as Error).message);

        return NextResponse.json({
            error: (err as Error).message,
        }, { status: 500 });
    }
}
