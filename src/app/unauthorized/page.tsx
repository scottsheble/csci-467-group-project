import Link from 'next/link';

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 text-center">
                <div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Access Denied
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        You don't have permission to access this page.
                    </p>
                </div>
                
                <div className="mt-8 space-y-4">
                    <p className="text-gray-700">
                        Please contact your administrator if you believe this is an error.
                    </p>
                    
                    <div className="flex justify-center space-x-4">
                        <Link 
                            href="/"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                            Go Home
                        </Link>
                        <Link 
                            href="/login"
                            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                        >
                            Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
