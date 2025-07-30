import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);
        
        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }
        
        return NextResponse.json(
            { 
                user: {
                    id: user.userId,
                    email: user.email,
                    name: user.name,
                    roles: user.roles
                }
            },
            { status: 200 }
        );
        
    } catch (error) {
        console.error('Auth check error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
