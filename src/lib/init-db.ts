import { dbManager } from "@/lib/database";

const initializeDatabases = async ( ) => {
    try {
        console.log('Initializing databases...');
        await Promise.all([
            dbManager.ensureInternalDbInitialized(),
            dbManager.ensureLegacyDbInitialized()
        ]);
        console.log('Databases initialized successfully');
    } catch (error) {
        console.error('Failed to initialize databases:', error);
    }
};

if ( typeof window === 'undefined' ) {
    // Only run server-side
    initializeDatabases();
}

export default initializeDatabases;
