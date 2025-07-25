import { internal_db, SecretNoteAttributes } from "@/models/internal/db";
import { dbManager } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";
import propagate from "@/lib/propagate";

/****
    * Creates a new secret note for a quote in the internal database.
    *
    * Expected HTTP Method: POST
    * Expected Query Parameters:
    * - `quote_id`: Required. ID of the quote to add the secret note to.
    * Expected JSON Body:
    * - `content`: Required. Content of the secret note.
    * 
    * Example Usage:
    * ```Next.js
    * const response = await fetch('/api/quotes/secret-notes/create?quote_id=123', {
    *   method: 'POST',
    *   headers: { 'Content-Type': 'application/json' },
    *   body: JSON.stringify({
    *     content: 'This is a secret note about the quote'
    *   })
    * });
    * const secretNote = await response.json();
    * ```
    */
export async function POST (
    request: NextRequest
): Promise<NextResponse<SecretNoteAttributes | { error: string }>> {
    try {
        await dbManager.ensureInternalDbInitialized();

        // Check that the `quote_id` was provided and exists
        const quote_id = propagate(
            request.nextUrl.searchParams.get('quote_id'),
            'Missing `quote_id` in request!');
        
        const quote = await propagate(internal_db.Quote, "Quote model not initialized!")
            .findByPk(quote_id);
        
        if (!quote) {
            return NextResponse.json({
                error: `Quote with ID ${quote_id} not found`
            }, { status: 404 });
        }

        // Unpack the request JSON body
        const secretNote_json = await request.json();
        const content: string = propagate(secretNote_json.content, 'Missing `content` in request!');

        // Create the secret note in the internal database
        const secretNote = await propagate(internal_db.SecretNote, "SecretNote model not initialized!")
            .create({
                content: content,
                quoteId: parseInt(quote_id)
            });

        return NextResponse.json(secretNote, { status: 201 });
    } catch (err) {
        console.log('ERROR: API - ', (err as Error).message);

        return NextResponse.json({
            error: (err as Error).message,
        }, { status: 500 });
    }
}
