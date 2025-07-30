import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes, HasManyGetAssociationsMixin, HasManyAddAssociationMixin, HasManyCreateAssociationMixin, BelongsToGetAssociationMixin, BelongsToSetAssociationMixin, BelongsToCreateAssociationMixin, CreationOptional } from 'sequelize';
import { LineItem } from './lineitem';
import { SecretNote } from './secretnote';
import { Employee } from './employee';

// Define the interface for the quote attributes
export interface QuoteAttributes {
    id: CreationOptional<number>;
    email: string;
    customer_id: number;

    status: string;
    date_created: CreationOptional<Date>;
    sales_associate_id: number | null;
    
    initial_discount_value: CreationOptional<number | null>;
    initial_discount_type: CreationOptional<'percentage' | 'amount' | null>;
    final_discount_value: CreationOptional<number | null>;
    final_discount_type: CreationOptional<'percentage' | 'amount' | null>;
}

// Define the model class extending Sequelize's Model
export class Quote extends Model<
    InferAttributes<Quote>,
    InferCreationAttributes<Quote, { omit: 'id' | 'date_created' }>
> implements QuoteAttributes {
    declare id: CreationOptional<number>;
    declare email: string;
    declare customer_id: number;
    declare status: string;
    declare date_created: CreationOptional<Date>;
    declare sales_associate_id: number | null;
    declare initial_discount_value: CreationOptional<number | null>;
    declare initial_discount_type: CreationOptional<'percentage' | 'amount' | null>;
    declare final_discount_value: CreationOptional<number | null>;
    declare final_discount_type: CreationOptional<'percentage' | 'amount' | null>;

    // Association methods for LineItems
    declare getLineItems: HasManyGetAssociationsMixin<LineItem>;
    declare addLineItem: HasManyAddAssociationMixin<LineItem, number>;
    declare createLineItem: HasManyCreateAssociationMixin<LineItem, 'quoteId'>;
    
    // Association methods for SecretNotes
    declare getSecretNotes: HasManyGetAssociationsMixin<SecretNote>;
    declare addSecretNote: HasManyAddAssociationMixin<SecretNote, number>;
    declare createSecretNote: HasManyCreateAssociationMixin<SecretNote, 'quoteId'>;
    
    // Association methods for Employee (Sales Associate)
    declare getSalesAssociate: BelongsToGetAssociationMixin<Employee>;
    declare setSalesAssociate: BelongsToSetAssociationMixin<Employee, number>;
    declare createSalesAssociate: BelongsToCreateAssociationMixin<Employee>;
    
    // Virtual fields to include associated models
    declare LineItems?: LineItem[];
    declare SecretNotes?: SecretNote[];
    declare SalesAssociate?: Employee;
}

export default function createQuoteModel(sequelize: Sequelize) {
    Quote.init(
        {
            id: { type: DataTypes.INTEGER,  allowNull: false,  primaryKey: true,  autoIncrement: true  },
            email: {  type: DataTypes.STRING,  allowNull: false, validate: { isEmail: true } },
            customer_id: {  type: DataTypes.INTEGER,  allowNull: false },
            status: { type: DataTypes.ENUM('DraftQuote', 'FinalizedUnresolvedQuote', 'SanctionedQuote', 'UnprocessedPurchaseOrder', 'Processed'), allowNull: false },
            date_created: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            sales_associate_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'employees', key: 'id' } },
            initial_discount_value: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
            initial_discount_type: { type: DataTypes.ENUM('percentage', 'amount'), allowNull: true },
            final_discount_value: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
            final_discount_type: { type: DataTypes.ENUM('percentage', 'amount'), allowNull: true }
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