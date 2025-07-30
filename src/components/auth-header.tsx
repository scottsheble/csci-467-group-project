'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function AuthHeader() {
    const { user, logout, isLoading } = useAuth();

    if (isLoading) {
        return null; // or a loading spinner
    }

    if (!user) {
        return (
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Link href="/" className="text-xl font-bold text-gray-900">
                                Quote Management System
                            </Link>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link 
                                href="/login" 
                                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Login
                            </Link>
                        </div>
                    </div>
                </div>
            </header>
        );
    }

    return (
        <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <Link href="/" className="text-xl font-bold text-gray-900">
                            Quote Management System
                        </Link>
                    </div>
                    
                    <nav className="hidden md:flex space-x-8">
                        {user.roles.is_sales_associate && (
                            <Link 
                                href="/quotes" 
                                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                My Quotes
                            </Link>
                        )}
                        
                        {(user.roles.is_quote_manager || user.roles.is_admin) && (
                            <Link 
                                href="/quotes/manage" 
                                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Manage Quotes
                            </Link>
                        )}
                        
                        {(user.roles.is_purchase_manager || user.roles.is_admin) && (
                            <Link 
                                href="/purchase-orders" 
                                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Purchase Orders
                            </Link>
                        )}
                        
                        {user.roles.is_admin && (
                            <Link 
                                href="/admin" 
                                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Administration
                            </Link>
                        )}
                    </nav>

                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-700">
                            Welcome, {user.name}
                        </span>
                        <button
                            onClick={logout}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
