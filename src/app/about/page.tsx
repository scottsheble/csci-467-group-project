"use client";

import Background from '@/components/background';
import styles from '@/styles/login.module.css'; // Reusing login styles for consistency

export default function AboutPage() {
    return (
        <div className={styles.loginContainer}>
            <Background />
            <div className={styles.loginCard} style={{ maxWidth: '800px' }}>
                <div className={styles.title}>
                    <h2><strong>About Lexos</strong></h2>
                </div>
                
                <div style={{ textAlign: 'left', lineHeight: '1.6' }}>
                    <section style={{ marginBottom: '2rem' }}>
                        <h3 style={{ color: 'var(--text-accent-color)', marginBottom: '1rem' }}>
                            What is Lexos?
                        </h3>
                        <p style={{ marginBottom: '1rem' }}>
                            Lexos is a comprehensive sales quote management platform designed to streamline 
                            your business operations and enhance collaboration across teams. Built with modern 
                            web technologies, Lexos provides an intuitive interface for managing quotes, 
                            customers, and sales processes.
                        </p>
                    </section>

                    <section style={{ marginBottom: '2rem' }}>
                        <h3 style={{ color: 'var(--text-accent-color)', marginBottom: '1rem' }}>
                            Key Features
                        </h3>
                        <ul style={{ paddingLeft: '1.5rem' }}>
                            <li style={{ marginBottom: '0.5rem' }}>
                                <strong>Quote Management:</strong> Create, edit, and track quotes through their entire lifecycle
                            </li>
                            <li style={{ marginBottom: '0.5rem' }}>
                                <strong>Role-Based Access:</strong> Different user roles with appropriate permissions and workflows
                            </li>
                            <li style={{ marginBottom: '0.5rem' }}>
                                <strong>Customer Integration:</strong> Seamless integration with existing customer databases
                            </li>
                            <li style={{ marginBottom: '0.5rem' }}>
                                <strong>Purchase Order Processing:</strong> Convert approved quotes into purchase orders
                            </li>
                            <li style={{ marginBottom: '0.5rem' }}>
                                <strong>Real-time Collaboration:</strong> Multiple team members can work together efficiently
                            </li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '2rem' }}>
                        <h3 style={{ color: 'var(--text-accent-color)', marginBottom: '1rem' }}>
                            User Roles
                        </h3>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <strong>Sales Associates:</strong> Create and manage customer quotes, add line items, and apply initial discounts.
                            </div>
                            <div>
                                <strong>Quote Managers:</strong> Review finalized quotes, apply final discounts, and sanction quotes for processing.
                            </div>
                            <div>
                                <strong>Purchase Order Managers:</strong> Convert sanctioned quotes into purchase orders and manage the fulfillment process.
                            </div>
                            <div>
                                <strong>Administrators:</strong> Full system access with user management and comprehensive oversight capabilities.
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 style={{ color: 'var(--text-accent-color)', marginBottom: '1rem' }}>
                            Technology Stack
                        </h3>
                        <p>
                            Lexos is built using cutting-edge web technologies including Next.js, React, 
                            TypeScript, and modern database solutions to ensure reliability, scalability, 
                            and excellent user experience.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}