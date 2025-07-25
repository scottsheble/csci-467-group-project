import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes, HasManyGetAssociationsMixin, HasManyAddAssociationMixin, HasManyCreateAssociationMixin, CreationOptional } from 'sequelize';
import { LineItem } from './lineitem';
import { SecretNote } from './secretnote';

// Define the interface for the quote attributes
export interface QuoteAttributes {
    id: CreationOptional<number>;
    email: string;
    customer_id: number;
    status: string;
}

// Define the model class extending Sequelize's Model
export class Quote extends Model<
    InferAttributes<Quote>,
    InferCreationAttributes<Quote, { omit: 'id' }>
> implements QuoteAttributes {
    declare id: CreationOptional<number>;
    declare email: string;
    declare customer_id: number;
    declare status: string;

    // Association methods for LineItems
    declare getLineItems: HasManyGetAssociationsMixin<LineItem>;
    declare addLineItem: HasManyAddAssociationMixin<LineItem, number>;
    declare createLineItem: HasManyCreateAssociationMixin<LineItem, 'quoteId'>;
    
    // Association methods for SecretNotes
    declare getSecretNotes: HasManyGetAssociationsMixin<SecretNote>;
    declare addSecretNote: HasManyAddAssociationMixin<SecretNote, number>;
    declare createSecretNote: HasManyCreateAssociationMixin<SecretNote, 'quoteId'>;
    
    // Virtual fields to include associated models
    declare LineItems?: LineItem[];
    declare SecretNotes?: SecretNote[];
}

export default function createQuoteModel(sequelize: Sequelize) {
    Quote.init(
        {
            id: { type: DataTypes.INTEGER,  allowNull: false,  primaryKey: true,  autoIncrement: true  },
            email: {  type: DataTypes.STRING,  allowNull: false, validate: { isEmail: true } },
            customer_id: {  type: DataTypes.INTEGER,  allowNull: false },
            status: { type: DataTypes.ENUM('DraftQuote', 'FinalizedUnresolvedQuote', 'SanctionedQuote', 'UnprocessedPurchaseOrder', 'Processed'), allowNull: false }
        },
        {
            sequelize,
            modelName: 'Quote',
            tableName: 'quotes',
            timestamps: true, // Enables createdAt and updatedAt
        }
    );

    return Quote;
}