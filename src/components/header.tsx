'use client';

import styles from "@/styles/header.module.css";
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
    const { user, logout } = useAuth();

    return (
        <header className={styles.header}>
            <div className={styles.headerContainer}>
                <div className={styles.headerLeft}>
                    <a href="/">
                        <img src="https://github.com/user-attachments/assets/c85ffe0b-a615-46d0-b8ed-c179de7e067a"
                        alt="Lexos Logo" className={styles.headerLogo} />
                    </a>
                </div>
                
                <nav className={styles.headerNav}>
                    {user && (
                        <a id={styles.welcomeMessage}>Welcome, {user.name}</a>
                    )}

                    <a href="/about">About</a>
                    <a href="/contact">Contact</a>
                    
                    {!user && (
                        <a href="/login">Login</a>
                    )}
                    {user && (
                        <>
                        {user.roles.is_sales_associate && (
                            <a href="/employee/sales-associate">My Quotes</a>
                        )}
                        {(user.roles.is_quote_manager || user.roles.is_admin) && (
                            <a href="/employee/quote-manager">Manage Quotes</a>
                        )}
                        {(user.roles.is_purchase_manager || user.roles.is_admin) && (
                            <a href="/employee/purchase-order-manager">Purchase Orders</a>
                        )}
                        {user.roles.is_admin && (
                            <a href="/employee/administrator">Administration</a>
                        )}
                        
                        <a onClick={logout} >
                            Logout
                        </a>
                    </>
                    )}
                </nav>
            </div>
        </header>
    );
}