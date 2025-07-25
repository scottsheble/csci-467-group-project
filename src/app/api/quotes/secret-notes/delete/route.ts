import { internal_db } from "@/models/internal/db";
import { dbManager } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";
import propagate from "@/lib/propagate";

/****
    * Deletes an existing secret note from the internal database.
    *
    * Expected HTTP Method: DELETE
    * Expected Query Parameters:
    * - `secret_note_id`: Required. ID of the secret note to delete.
    * Expected JSON Body: None
    * 
    * Example Usage:
    * ```Next.js
    * const response = await fetch('/api/quotes/secret-notes/delete?secret_note_id=1', {
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

        // Check that the `secret_note_id` was provided
        const secret_note_id = propagate(
            request.nextUrl.searchParams.get('secret_note_id'),
            'Missing `secret_note_id` in request!');

        // Find the secret note to delete
        const secretNote = await propagate(internal_db.SecretNote, "SecretNote model not initialized!")
            .findByPk(secret_note_id);
        
        if (!secretNote) {
            return NextResponse.json({
                error: `Secret note with ID ${secret_note_id} not found`
            }, { status: 404 });
        }

        // Delete the secret note
        await secretNote.destroy();

        return NextResponse.json({
            message: `Secret note with ID ${secret_note_id} has been deleted successfully`
        }, { status: 200 });
    } catch (err) {
        console.log('ERROR: API - ', (err as Error).message);

        return NextResponse.json({
            error: (err as Error).message,
        }, { status: 500 });
    }
}
