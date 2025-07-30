"use client";

import type { LegacyCustomerAttributes } from "@/models/legacy/db";
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {
	const [customers, setCustomers] = useState<LegacyCustomerAttributes[]>([]);
	const [error, setError] = useState<string>('');
	const { user, isLoading } = useAuth();

	useEffect(() => {
		async function fetchCustomers() {
			try {
				const response = await fetch('/api/customers/get');
				if (!response.ok) {
					if (response.status === 401) {
						setError('Please log in to view customers');
						return;
					}
					throw new Error('Network response was not ok');
				}
				const data: LegacyCustomerAttributes[] = await response.json();
				setCustomers(data);
			} catch (error) {
				console.error('Failed to fetch customers:', error);
				setError('Failed to fetch customers');
			}
		}

		if (!isLoading) {
			fetchCustomers();
		}
	}, [isLoading]);

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-lg">Loading...</div>
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<div className="text-center mb-8">
				<h1 className="text-4xl font-bold text-gray-900 mb-4">
					Welcome to Quote Management System
				</h1>
				<p className="text-lg text-gray-600 mb-8">
					Streamline your sales quote process with our comprehensive management platform
				</p>
				
				{!user ? (
					<div className="space-y-4">
						<p className="text-gray-700">Please log in to access the system.</p>
						<Link 
							href="/login"
							className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md text-lg font-medium"
						>
							Login to Get Started
						</Link>
					</div>
				) : (
					<div className="space-y-6">
						<div className="bg-green-50 border border-green-200 rounded-md p-4">
							<p className="text-green-800">
								Welcome back, <strong>{user.name}</strong>! 
							</p>
						</div>
						
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
							{user.roles.is_sales_associate && (
								<Link 
									href="/quotes"
									className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 text-center"
								>
									<h3 className="font-semibold text-blue-900">My Quotes</h3>
									<p className="text-sm text-blue-700 mt-1">Create and manage your quotes</p>
								</Link>
							)}
							
							{(user.roles.is_quote_manager || user.roles.is_admin) && (
								<Link 
									href="/quotes/manage"
									className="bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg p-4 text-center"
								>
									<h3 className="font-semibold text-purple-900">Manage Quotes</h3>
									<p className="text-sm text-purple-700 mt-1">Process and sanction quotes</p>
								</Link>
							)}
							
							{(user.roles.is_purchase_manager || user.roles.is_admin) && (
								<Link 
									href="/purchase-orders"
									className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-4 text-center"
								>
									<h3 className="font-semibold text-green-900">Purchase Orders</h3>
									<p className="text-sm text-green-700 mt-1">Convert quotes to orders</p>
								</Link>
							)}
							
							{user.roles.is_admin && (
								<Link 
									href="/admin"
									className="bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg p-4 text-center"
								>
									<h3 className="font-semibold text-red-900">Administration</h3>
									<p className="text-sm text-red-700 mt-1">Manage employees and system</p>
								</Link>
							)}
						</div>
					</div>
				)}
			</div>

			{user && (
				<div className="mt-12">
					<h2 className="text-2xl font-bold text-gray-900 mb-4">Customer Directory</h2>
					{error ? (
						<div className="bg-red-50 border border-red-200 rounded-md p-4">
							<p className="text-red-800">{error}</p>
						</div>
					) : customers.length > 0 ? (
						<div className="bg-white shadow overflow-hidden sm:rounded-md">
							<ul className="divide-y divide-gray-200">
								{customers.map(customer => (
									<li key={customer.id} className="px-6 py-4">
										<div className="flex items-center justify-between">
											<div>
												<h3 className="text-lg font-medium text-gray-900">{customer.name}</h3>
												<p className="text-sm text-gray-500">ID: {customer.id}</p>
											</div>
										</div>
									</li>
								))}
							</ul>
						</div>
					) : (
						<div className="bg-gray-50 border border-gray-200 rounded-md p-4">
							<p className="text-gray-700">No customers found.</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}