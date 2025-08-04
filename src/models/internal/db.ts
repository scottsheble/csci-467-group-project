import { Sequelize } from 'sequelize';
import createQuoteModel, { Quote } from './quote';
import createLineItemModel, { LineItem } from './lineitem';
import createSecretNoteModel, { SecretNote } from './secretnote';
import createEmployeeModel, { Employee } from './employee';
import path from 'path';
import * as sqlite3 from 'sqlite3';

export type { QuoteAttributes } from './quote';
export type { LineItemAttributes } from './lineitem';
export type { SecretNoteAttributes } from './secretnote';
export type { EmployeeAttributes } from './employee';
export { Quote, LineItem, SecretNote, Employee };

export const internal_db = {
    Quote: null as typeof Quote | null,
    LineItem: null as typeof LineItem | null,
    SecretNote: null as typeof SecretNote | null,
    Employee: null as typeof Employee | null,
    sequelize: null as Sequelize | null,
    initializeWithLocalDb
};

async function initialize(sequelize: Sequelize) {
    internal_db.Quote = createQuoteModel(sequelize);
    internal_db.LineItem = createLineItemModel(sequelize);
    internal_db.SecretNote = createSecretNoteModel(sequelize);
    internal_db.Employee = createEmployeeModel(sequelize);
    internal_db.sequelize = sequelize;

    setupAssociations();
}

async function initializeWithLocalDb(dbPath?: string) {
    const defaultPath = path.join(process.cwd(), 'internal.db');
    const databasePath = dbPath || defaultPath;

    const sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: databasePath,
        logging: false,
        dialectOptions: {
            pragma: {
                foreign_keys: 1
            }
        },
        dialectModule: sqlite3
    });

    // Initialize models with this sequelize instance
    await initialize(sequelize);

    // Test the connection
    try {
        await sequelize.authenticate();
        console.log('Connection to internal.db has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        throw error;
    }

    // Sync the database (create tables if they don't exist)
    await sequelize.sync();
    console.log('Database synchronized successfully.');

    return sequelize;
}

function setupAssociations() {
    if (!internal_db.Quote || !internal_db.LineItem || !internal_db.SecretNote || !internal_db.Employee) {
        throw new Error('Models must be initialized before setting up associations');
    }

    // Quote to LineItem associations
    internal_db.Quote.hasMany(internal_db.LineItem, {
        foreignKey: 'quoteId',
        as: 'LineItems'
    });
    internal_db.LineItem.belongsTo(internal_db.Quote, {
        foreignKey: 'quoteId',
        as: 'Quote'
    });

    // Quote to SecretNote associations
    internal_db.Quote.hasMany(internal_db.SecretNote, {
        foreignKey: 'quoteId',
        as: 'SecretNotes'
    });
    internal_db.SecretNote.belongsTo(internal_db.Quote, {
        foreignKey: 'quoteId',
        as: 'Quote'
    });

    // Quote to Employee (Sales Associate) associations
    internal_db.Quote.belongsTo(internal_db.Employee, {
        foreignKey: 'sales_associate_id',
        as: 'SalesAssociate'
    });
    internal_db.Employee.hasMany(internal_db.Quote, {
        foreignKey: 'sales_associate_id',
        as: 'Quotes'
    });
}
