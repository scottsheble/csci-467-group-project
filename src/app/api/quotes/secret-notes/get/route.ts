import { internal_db, SecretNoteAttributes } from "@/models/internal/db";
import { dbManager } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";
import propagate from "@/lib/propagate";

/****
    * Retrieves secret notes from the internal database.
    *
    * Expected HTTP Method: GET
    * Expected Query Parameters:
    * - `quote_id`: Optional. Filter secret notes by quote ID.
    * - `secret_note_id`: Optional. Get a specific secret note by ID.
    * 
    * Example Usages:
    * ```Next.js
    * // Get all secret notes for a specific quote
    * const response = await fetch('/api/quotes/secret-notes/get?quote_id=123');
    * const secretNotes = await response.json();
    * 
    * // Get a specific secret note by ID
    * const response = await fetch('/api/quotes/secret-notes/get?secret_note_id=1');
    * const secretNote = await response.json();
    * ```
    */
export async function GET (
    request: NextRequest
): Promise<NextResponse<SecretNoteAttributes[] | SecretNoteAttributes | { error: string }>> {
    try {
        await dbManager.ensureInternalDbInitialized();

        const searchParams = request.nextUrl.searchParams;
        const secret_note_id = searchParams.get('secret_note_id');

        // If specific secret note ID is provided
        if (secret_note_id) {
            const secretNote = await propagate(internal_db.SecretNote, "SecretNote model not initialized!")
                .findByPk(parseInt(secret_note_id));
            
            if (!secretNote) {
                return NextResponse.json({
                    error: `Secret note with ID ${secret_note_id} not found`
                }, { status: 404 });
            }

            return NextResponse.json(secretNote, { status: 200 });
        }

        // Otherwise, check if `quote_id` is provided and
        //  verify the quote exists
        const quote_id = propagate(
            searchParams.get('quote_id'),
            'Missing `quote_id` and `secret_note_id` in request!');
        propagate(
            await internal_db.Quote?.findByPk(parseInt(quote_id)),
            `Quote with ID ${quote_id} not found!`);

        const secretNotes = await propagate(internal_db.SecretNote, "SecretNote model not initialized!")
            .findAll({
                where: { quoteId: parseInt(quote_id) }
            });

        return NextResponse.json(secretNotes, { status: 200 });
    } catch (err) {
        console.log('ERROR: API - ', (err as Error).message);

        return NextResponse.json({
            error: (err as Error).message,
        }, { status: 500 });
    }
}
