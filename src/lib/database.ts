import { internal_db } from "@/models/internal/db";
import { legacy_db } from "@/models/legacy/db";

class DatabaseManager {
    private static instance: DatabaseManager;
    private internalDbInitialized = false;
    private legacyDbInitialized = false;
    private initializingInternal = false;
    private initializingLegacy = false;

    private constructor ( ) { };

    static getInstance ( ): DatabaseManager {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        
        return DatabaseManager.instance;
    };

    async ensureInternalDbInitialized ( ): Promise<void> {
        if ( this.internalDbInitialized ) {
            return;
        };

        if ( this.initializingInternal ) {
            // Wait for ongoing initialization
            while ( this.initializingInternal ) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return;
        };

        this.initializingInternal = true;
        try {
            await internal_db.initializeWithLocalDb();
            this.internalDbInitialized = true;
        } finally {
            this.initializingInternal = false;
        }
    }

    async ensureLegacyDbInitialized ( ): Promise<void> {
        if ( this.legacyDbInitialized ) {
            return;
        }

        if ( this.initializingLegacy ) {
            // Wait for ongoing initialization
            while ( this.initializingLegacy ) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return;
        }

        this.initializingLegacy = true;
        try {
            await legacy_db.initialize();
            this.legacyDbInitialized = true;
        } finally {
            this.initializingLegacy = false;
        }
    };

    isInternalDbInitialized ( ): boolean {
        return this.internalDbInitialized;
    };

    isLegacyDbInitialized ( ): boolean {
        return this.legacyDbInitialized;
    };
}

export const dbManager = DatabaseManager.getInstance();