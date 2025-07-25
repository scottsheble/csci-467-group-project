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
    * - `id`: Optional. Get a specific secret note by ID.
    * 
    * Example Usages:
    * ```Next.js
    * // Get all secret notes for a specific quote
    * const response = await fetch('/api/quotes/secret-notes/get?quote_id=123');
    * const secretNotes = await response.json();
    * 
    * // Get a specific secret note by ID
    * const response = await fetch('/api/quotes/secret-notes/get?id=1');
    * const secretNote = await response.json();
    * 
    * // Get all secret notes
    * const response = await fetch('/api/quotes/secret-notes/get');
    * const allSecretNotes = await response.json();
    * ```
    */
export async function GET (
    request: NextRequest
): Promise<NextResponse<SecretNoteAttributes[] | SecretNoteAttributes | { error: string }>> {
    try {
        await dbManager.ensureInternalDbInitialized();

        const searchParams = request.nextUrl.searchParams;
        const quote_id = searchParams.get('quote_id');
        const id = searchParams.get('id');

        // If specific secret note ID is provided
        if (id) {
            const secretNote = await propagate(internal_db.SecretNote, "SecretNote model not initialized!")
                .findByPk(parseInt(id));
            
            if (!secretNote) {
                return NextResponse.json({
                    error: `Secret note with ID ${id} not found`
                }, { status: 404 });
            }

            return NextResponse.json(secretNote, { status: 200 });
        }

        // If quote_id is provided, filter by quote
        if (quote_id) {
            // Verify the quote exists
            const quote = await propagate(internal_db.Quote, "Quote model not initialized!")
                .findByPk(parseInt(quote_id));
            
            if (!quote) {
                return NextResponse.json({
                    error: `Quote with ID ${quote_id} not found`
                }, { status: 404 });
            }

            const secretNotes = await propagate(internal_db.SecretNote, "SecretNote model not initialized!")
                .findAll({
                    where: { quoteId: parseInt(quote_id) },
                    order: [['createdAt', 'DESC']]
                });

            return NextResponse.json(secretNotes, { status: 200 });
        }

        // Get all secret notes
        const secretNotes = await propagate(internal_db.SecretNote, "SecretNote model not initialized!")
            .findAll({
                order: [['createdAt', 'DESC']]
            });

        return NextResponse.json(secretNotes, { status: 200 });
    } catch (err) {
        console.log('ERROR: API - ', (err as Error).message);

        return NextResponse.json({
            error: (err as Error).message,
        }, { status: 500 });
    }
}
