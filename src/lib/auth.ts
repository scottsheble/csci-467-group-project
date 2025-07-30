import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { internal_db } from '@/models/internal/db';
import { Employee } from '@/models/internal/employee';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthPayload {
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

export function generateToken(payload: AuthPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): AuthPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as AuthPayload;
    } catch (error) {
        return null;
    }
}

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthPayload | null> {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
        return null;
    }
    
    return verifyToken(token);
}

export async function authenticateEmployee(email: string, password: string): Promise<AuthPayload | null> {
    try {
        if (!internal_db.sequelize) {
            await internal_db.initializeWithLocalDb();
        }
        
        if (!internal_db.Employee) {
            throw new Error('Employee model not initialized');
        }
        
        const employee = await internal_db.Employee.findOne({
            where: { email }
        });
        
        if (!employee) {
            return null;
        }
        
        // Compare password (note: in your current model, passwords are stored as plain text)
        // In production, you should hash passwords and use comparePassword
        if (employee.password !== password) {
            return null;
        }
        
        return {
            userId: employee.id,
            email: employee.email,
            name: employee.name,
            roles: {
                is_sales_associate: employee.is_sales_associate || false,
                is_quote_manager: employee.is_quote_manager || false,
                is_purchase_manager: employee.is_purchase_manager || false,
                is_admin: employee.is_admin || false
            }
        };
    } catch (error) {
        console.error('Authentication error:', error);
        return null;
    }
}

export function hasRole(user: AuthPayload, role: keyof AuthPayload['roles']): boolean {
    return user.roles[role];
}

export function hasAnyRole(user: AuthPayload, roles: (keyof AuthPayload['roles'])[]): boolean {
    return roles.some(role => user.roles[role]);
}

// Permission checks for different operations
export function canManageQuotes(user: AuthPayload): boolean {
    return hasAnyRole(user, ['is_quote_manager', 'is_admin']);
}

export function canManagePurchaseOrders(user: AuthPayload): boolean {
    return hasAnyRole(user, ['is_purchase_manager', 'is_admin']);
}

export function canManageEmployees(user: AuthPayload): boolean {
    return hasRole(user, 'is_admin');
}

export function canCreateQuotes(user: AuthPayload): boolean {
    return hasAnyRole(user, ['is_sales_associate', 'is_admin']);
}

export function canEditOwnQuotes(user: AuthPayload): boolean {
    return hasAnyRole(user, ['is_sales_associate', 'is_admin']);
}
