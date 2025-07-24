import { legacy_db, LegacyCustomerAttributes } from "@/models/legacy/db";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse<LegacyCustomerAttributes[] | { error: string; returnedStatus: number }>> {
	try {
		await legacy_db.initialize();

		if (!legacy_db.LegacyCustomer) {
			throw new Error('LegacyCustomer model not initialized');
		}

		const legacy_customers = await legacy_db.LegacyCustomer.findAll();

		return NextResponse.json(legacy_customers);
	} catch (err) {
		console.log('ERROR: API - ', (err as Error).message);

		const response = {
			error: (err as Error).message,
			returnedStatus: 200,
		};

		return NextResponse.json(response, { status: 200 });
	}
}