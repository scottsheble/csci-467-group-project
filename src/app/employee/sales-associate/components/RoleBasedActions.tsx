"use client";

import Link from "next/link";
import styles from "@/styles/sales-associate.module.css";

interface UserRoles {
  is_quote_manager: boolean;
  is_admin: boolean;
  is_purchase_manager: boolean;
}

interface RoleBasedActionsProps {
  roles: UserRoles;
}

export default function RoleBasedActions({ roles }: RoleBasedActionsProps) {
  const actions = [];

  if (roles.is_quote_manager || roles.is_admin) {
    actions.push({
      href: "/quotes/manage",
      title: "Manage Quotes",
      description: "Process and sanction quotes",
      key: "manage-quotes",
    });
  }

  if (roles.is_purchase_manager || roles.is_admin) {
    actions.push({
      href: "/purchase-orders",
      title: "Purchase Orders",
      description: "Convert quotes to orders",
      key: "purchase-orders",
    });
  }

  if (roles.is_admin) {
    actions.push({
      href: "/admin",
      title: "Administration",
      description: "Manage employees and system",
      key: "admin",
    });
  }

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className={styles.dashboardGrid}>
      {actions.map((action) => (
        <Link
          key={action.key}
          href={action.href}
          className={styles.actionCard}
        >
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>{action.title}</h3>
            <p>{action.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
