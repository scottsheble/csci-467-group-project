"use client";

import type { LegacyCustomerAttributes } from "@/models/legacy/db";

import { useEffect, useState } from 'react';

export default function Home() {
	const [customers, setCustomers] = useState<LegacyCustomerAttributes[]>([]);

	useEffect(() => {
		async function fetchCustomers() {
			try {
				const response = await fetch('/api/get_customers');
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				const data: LegacyCustomerAttributes[] = await response.json();
				setCustomers(data);
			} catch (error) {
				console.error('Failed to fetch customers:', error);
			}
		}

		fetchCustomers();
	}, []);

	return (
		<div>
			<h1>Welcome to the Home Page</h1>
			<ul>
				{customers.map(customer => (
					<li key={customer.id}>{customer.name}</li>
				))}
			</ul>
		</div>
	);
}