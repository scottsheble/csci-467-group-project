import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, AuthPayload } from '@/lib/auth';

export type PermissionCheck = (user: AuthPayload) => boolean;

export function withAuth(
    handler: (request: NextRequest, user: AuthPayload) => Promise<NextResponse>,
    permissionCheck?: PermissionCheck
) {
    return async (request: NextRequest): Promise<NextResponse> => {
        try {
            const user = await getAuthenticatedUser(request);
            
            if (!user) {
                return NextResponse.json(
                    { error: 'Authentication required' },
                    { status: 401 }
                );
            }
            
            if (permissionCheck && !permissionCheck(user)) {
                return NextResponse.json(
                    { error: 'Insufficient permissions' },
                    { status: 403 }
                );
            }
            
            return handler(request, user);
            
        } catch (error) {
            console.error('Auth middleware error:', error);
            return NextResponse.json(
                { error: 'Internal server error' },
                { status: 500 }
            );
        }
    };
}

// Common permission checks
export const requireSalesAssociate: PermissionCheck = (user) => 
    user.roles.is_sales_associate || user.roles.is_admin;

export const requireQuoteManager: PermissionCheck = (user) => 
    user.roles.is_quote_manager || user.roles.is_admin;

export const requirePurchaseManager: PermissionCheck = (user) => 
    user.roles.is_purchase_manager || user.roles.is_admin;

export const requireAdmin: PermissionCheck = (user) => 
    user.roles.is_admin;

export const requireAnyRole: PermissionCheck = (user) => 
    user.roles.is_sales_associate || 
    user.roles.is_quote_manager || 
    user.roles.is_purchase_manager || 
    user.roles.is_admin;
