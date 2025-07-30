import { NextRequest, NextResponse } from 'next/server';
import { authenticateEmployee, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;
        
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }
        
        const user = await authenticateEmployee(email, password);
        
        if (!user) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }
        
        const token = generateToken(user);
        
        const response = NextResponse.json(
            { 
                user: {
                    id: user.userId,
                    email: user.email,
                    name: user.name,
                    roles: user.roles
                },
                message: 'Login successful' 
            },
            { status: 200 }
        );
        
        // Set HTTP-only cookie
        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 // 24 hours
        });
        
        return response;
        
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
