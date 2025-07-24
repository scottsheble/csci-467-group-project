import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes } from 'sequelize';

// Define the interface for the customer attributes
export interface LegacyCustomerAttributes {
    id: number;
    name: string;
    city: string;
    street: string;
    contact: string;
}

// Define the model class extending Sequelize's Model
export class LegacyCustomer extends Model<
    InferAttributes<LegacyCustomer>,
    InferCreationAttributes<LegacyCustomer>
> implements LegacyCustomerAttributes {
    declare id: number;
    declare name: string;
    declare city: string;
    declare street: string;
    declare contact: string;
}

export default function createLegacyCustomerModel(sequelize: Sequelize) {
    LegacyCustomer.init(
        {
            id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
            name: { type: DataTypes.STRING, allowNull: false },
            city: { type: DataTypes.STRING, allowNull: false },
            street: { type: DataTypes.STRING, allowNull: false },
            contact: { type: DataTypes.STRING, allowNull: false },
        },
        {
            sequelize,
            modelName: 'LegacyCustomer',
            tableName: 'customers', // Adjust this to match your actual table name
            timestamps: false, // Adjust based on whether your table has timestamps
        }
    );

    return LegacyCustomer;
}