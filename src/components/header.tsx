'use client';

import styles from "@/styles/header.module.css";
import Link from "next/link";
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
    const { user, logout, isLoading } = useAuth();

    return (
        <header className={styles.header}>
            <div className={styles.headerContainer}>
                <div className={styles.headerLeft}>
                    <Link href="/">
                        <img src={undefined}
                        alt="Our Logo - todo!();" className={styles.headerLogo} />
                    </Link>
                    <span className="header-title">Quote Management System</span>
                </div>
                
                <nav className="header-nav" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/about">About</Link>
                    <Link href="/contact">Contact</Link>
                    
                    {!isLoading && (
                        <>
                            {!user ? (
                                <Link 
                                    href="/login" 
                                    style={{ 
                                        backgroundColor: '#4f46e5', 
                                        color: 'white', 
                                        padding: '0.5rem 1rem', 
                                        borderRadius: '0.375rem',
                                        textDecoration: 'none',
                                        fontSize: '0.875rem',
                                        fontWeight: '500'
                                    }}
                                >
                                    Login
                                </Link>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {/* Role-based navigation */}
                                    {user.roles.is_sales_associate && (
                                        <Link href="/employee/sales-associate">My Quotes</Link>
                                    )}
                                    
                                    {(user.roles.is_quote_manager || user.roles.is_admin) && (
                                        <Link href="/employee/quote-manager">Manage Quotes</Link>
                                    )}
                                    
                                    {(user.roles.is_purchase_manager || user.roles.is_admin) && (
                                        <Link href="/employee/purchase-order-manager">Purchase Orders</Link>
                                    )}
                                    
                                    {user.roles.is_admin && (
                                        <Link href="/employee/administrator">Administration</Link>
                                    )}
                                    
                                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                        Welcome, {user.name}
                                    </span>
                                    
                                    <button
                                        onClick={logout}
                                        style={{
                                            backgroundColor: '#dc2626',
                                            color: 'white',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '0.375rem',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            fontWeight: '500'
                                        }}
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}