"use client";

import type { LegacyCustomerAttributes } from "@/models/legacy/db";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useEffect, useState } from "react";
import Background from "@/components/background";
import QuoteCreationSection from "./components/QuoteCreationSection";
import QuotesList from "./components/QuotesList";
import RoleBasedActions from "./components/RoleBasedActions";
import styles from "@/styles/sales-associate.module.css";

export default function SalesAssociatePage() {
  const [customers, setCustomers] = useState<LegacyCustomerAttributes[]>([]);
  const [error, setError] = useState<string>("");
  const { user, isLoading } = useAuth();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const response = await fetch("/api/customers/get");
        if (!response.ok) {
          if (response.status === 401) {
            setError("Please log in to view customers");
            return;
          }
          throw new Error("Network response was not ok");
        }
        const data: LegacyCustomerAttributes[] = await response.json();
        setCustomers(data);

        // Only fetch quotes if user is loaded and is a sales associate
        if (user && user.roles.is_sales_associate) {
          await refreshQuotes();
        }
      } catch (error) {
        console.error("Failed to fetch customers:", error);
        setError("Failed to fetch customers");
      }
    }
    // Only fetch when isLoading is false and user is available
    if (!isLoading && user) {
      fetchCustomers();
    }
  }, [isLoading, user]);

  // Async function to handle refreshing quotes
  async function refreshQuotes() {
    try {
      const quotesResponse = await fetch("/api/quotes/get?status=DraftQuote");
      if (quotesResponse.ok) {
        const quotesData = await quotesResponse.json();
        setQuotes(Array.isArray(quotesData) ? quotesData : []);
      }
    } catch (error) {
      console.error("Failed to fetch quotes:", error);
    }
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <Background />
        <div className={styles.content}>
          <div className={styles.welcomeCard}>
            <div>Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${isModalOpen ? styles.modalOpen : ''}`}>
      <Background />
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            Welcome to Quote Management System
          </h1>
          <p className={styles.subtitle}>
            Streamline your sales quote process with our comprehensive management
            platform
          </p>
        </div>

        {!user ? (
          <div className={styles.welcomeCard}>
            <div className={styles.loginPrompt}>
              <p>Please log in to access the system.</p>
              <Link href="/login" className={styles.loginLink}>
                Login to Get Started
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.welcomeCard}>
              <div className={styles.welcomeMessage}>
                Welcome back, <strong>{user.name}</strong>!
              </div>
            </div>

            {error && (
              <div className={styles.welcomeCard}>
                <p style={{ color: "#dc3545" }}>{error}</p>
              </div>
            )}

            {user.roles.is_sales_associate && (
              <div className={`${styles.dashboardGrid} ${isModalOpen ? styles.modalOpen : ''}`}>
                <QuoteCreationSection
                  customers={customers}
                  onQuoteCreated={refreshQuotes}
                  onModalStateChange={setIsModalOpen}
                />
                <QuotesList
                  quotes={quotes}
                  customers={customers}
                  onRefresh={refreshQuotes}
                  onModalStateChange={setIsModalOpen}
                />
              </div>
            )}

            <RoleBasedActions roles={user.roles} />
          </>
        )}
      </div>
    </div>
  );
}
