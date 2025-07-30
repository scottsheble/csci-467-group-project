import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface AuthPayload {
    userId: number;
    email: string;
    name: string;
    roles: {
        is_sales_associate: boolean;
        is_quote_manager: boolean;
        is_purchase_manager: boolean;
        is_admin: boolean;
    };
}

function verifyToken(token: string): AuthPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as AuthPayload;
    } catch (error) {
        return null;
    }
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/api/auth/login', '/api/auth/logout', '/', '/unauthorized'];
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
    
    // API routes that require authentication
    const protectedApiRoutes = ['/api/quotes', '/api/employees', '/api/customers'];
    const isProtectedApiRoute = protectedApiRoutes.some(route => pathname.startsWith(route));
    
    // Dashboard routes that require authentication
    const protectedPageRoutes = ['/quotes', '/admin', '/purchase-orders'];
    const isProtectedPageRoute = protectedPageRoutes.some(route => pathname.startsWith(route));
    
    if (isPublicRoute) {
        return NextResponse.next();
    }
    
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
        if (isProtectedApiRoute) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }
        
        if (isProtectedPageRoute) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        
        return NextResponse.next();
    }
    
    const user = verifyToken(token);
    
    if (!user) {
        // Invalid token
        const response = isProtectedApiRoute 
            ? NextResponse.json({ error: 'Invalid token' }, { status: 401 })
            : NextResponse.redirect(new URL('/login', request.url));
            
        // Clear invalid token
        response.cookies.set('auth-token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 0
        });
        
        return response;
    }
    
    // Role-based route protection for pages
    if (isProtectedPageRoute) {
        if (pathname.startsWith('/admin') && !user.roles.is_admin) {
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
        
        if (pathname.startsWith('/purchase-orders') && 
            !user.roles.is_purchase_manager && !user.roles.is_admin) {
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
    }
    
    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|public).*)',
    ],
};
