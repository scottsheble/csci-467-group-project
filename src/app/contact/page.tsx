"use client";

import Background from '@/components/background';
import styles from '@/styles/login.module.css'; // Reusing login styles for consistency

export default function ContactPage() {
    return (
        <div className={styles.loginContainer}>
            <Background />
            <div className={styles.loginCard} style={{ maxWidth: '600px' }}>
                <div className={styles.title}>
                    <h2><strong>Contact Us</strong></h2>
                </div>
                
                <div style={{ textAlign: 'center', lineHeight: '1.8' }}>
                    <section style={{ marginBottom: '3rem' }}>
                        <p style={{ fontSize: '1.1rem', marginBottom: '2rem', color: 'var(--text-color)' }}>
                            We'd love to hear from you! Get in touch with us for support, 
                            questions, or feedback about Lexos.
                        </p>
                    </section>

                    <section style={{ marginBottom: '3rem' }}>
                        <h3 style={{ color: 'var(--text-accent-color)', marginBottom: '1.5rem' }}>
                            Get in Touch
                        </h3>
                        
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <strong style={{ color: 'var(--text-accent-color)' }}>Email:</strong>
                            </div>
                            <a 
                                href="mailto:me@hiibolt.com" 
                                style={{ 
                                    color: 'var(--text-color)',
                                    textDecoration: 'none',
                                    fontSize: '1.1rem',
                                    padding: '0.5rem 1rem',
                                    border: '1px solid var(--accent-color)',
                                    borderRadius: '8px',
                                    display: 'inline-block',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--accent-color)';
                                    e.currentTarget.style.color = 'white';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = 'var(--text-color)';
                                }}
                            >
                                me@hiibolt.com
                            </a>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <strong style={{ color: 'var(--text-accent-color)' }}>GitHub:</strong>
                            </div>
                            <a 
                                href="https://github.com/hiibolt" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ 
                                    color: 'var(--text-color)',
                                    textDecoration: 'none',
                                    fontSize: '1.1rem',
                                    padding: '0.5rem 1rem',
                                    border: '1px solid var(--accent-color)',
                                    borderRadius: '8px',
                                    display: 'inline-block',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--accent-color)';
                                    e.currentTarget.style.color = 'white';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = 'var(--text-color)';
                                }}
                            >
                                github.com/hiibolt
                            </a>
                        </div>
                    </section>

                    <section style={{ marginBottom: '2rem' }}>
                        <h3 style={{ color: 'var(--text-accent-color)', marginBottom: '1.5rem' }}>
                            Support Hours
                        </h3>
                        <div style={{ color: 'var(--text-color)' }}>
                            <p style={{ marginBottom: '0.5rem' }}>Monday - Friday: 9:00 AM - 6:00 PM (EST)</p>
                            <p style={{ marginBottom: '0.5rem' }}>Saturday: 10:00 AM - 4:00 PM (EST)</p>
                            <p>Sunday: Closed</p>
                        </div>
                    </section>

                    <section>
                        <div style={{ 
                            padding: '1.5rem',
                            backgroundColor: 'rgba(97, 137, 47, 0.1)',
                            borderRadius: '8px',
                            border: '1px solid var(--accent-color)'
                        }}>
                            <h4 style={{ color: 'var(--text-accent-color)', marginBottom: '1rem' }}>
                                Quick Response
                            </h4>
                            <p style={{ margin: '0', color: 'var(--text-color)' }}>
                                We typically respond to inquiries within 24 hours during business days. 
                                For urgent matters, please mention "URGENT" in your email subject line.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}