import { internal_db, SecretNoteAttributes } from "@/models/internal/db";
import { dbManager } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";
import propagate from "@/lib/propagate";

/****
    * Updates an existing secret note in the internal database.
    *
    * Expected HTTP Method: PUT
    * Expected Query Parameters:
    * - `secret_note_id`: Required. ID of the secret note to update.
    * Expected JSON Body:
    * - `content`: Required. Updated content of the secret note.
    * 
    * Example Usage:
    * ```Next.js
    * const response = await fetch('/api/quotes/secret-notes/edit?secret_note_id=1', {
    *   method: 'PUT',
    *   headers: { 'Content-Type': 'application/json' },
    *   body: JSON.stringify({
    *     content: 'Updated secret note content'
    *   })
    * });
    * const updatedSecretNote = await response.json();
    * ```
    */
export async function PUT (
    request: NextRequest
): Promise<NextResponse<SecretNoteAttributes | { error: string }>> {
    try {
        await dbManager.ensureInternalDbInitialized();

        // Check that the `secret_note_id` was provided
        const secret_note_id = propagate(
            request.nextUrl.searchParams.get('secret_note_id'),
            'Missing `secret_note_id` in request!');

        // Find the secret note to update
        const secretNote = await propagate(internal_db.SecretNote, "SecretNote model not initialized!")
            .findByPk(secret_note_id);
        
        if (!secretNote) {
            return NextResponse.json({
                error: `Secret note with ID ${secret_note_id} not found`
            }, { status: 404 });
        }

        // Unpack the request JSON body
        const secretNote_json = await request.json();
        const content: string = propagate(secretNote_json.content, 'Missing `content` in request!');

        // Update the secret note
        await secretNote.update({
            content: content
        });

        // Return the updated secret note
        await secretNote.reload();
        return NextResponse.json(secretNote, { status: 200 });
    } catch (err) {
        console.log('ERROR: API - ', (err as Error).message);

        return NextResponse.json({
            error: (err as Error).message,
        }, { status: 500 });
    }
}
