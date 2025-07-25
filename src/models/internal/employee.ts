import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

export interface EmployeeAttributes {
    id: CreationOptional<number>;
    email: string;
    password: string;
    is_sales_associate?: boolean;
    is_quote_manager?: boolean;
    is_purchase_manager?: boolean;
    is_admin?: boolean;
}

export class Employee extends Model<
    InferAttributes<Employee>,
    InferCreationAttributes<Employee, { }>
> implements EmployeeAttributes {
    declare id: CreationOptional<number>;
    declare email: string;
    declare password: string;
    declare is_sales_associate?: boolean;
    declare is_quote_manager?: boolean;
    declare is_purchase_manager?: boolean;
    declare is_admin?: boolean;
}

export default function createEmployeeModel(sequelize: Sequelize) {
    Employee.init(
        {
            id:       { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
            email:    { type: DataTypes.STRING, allowNull: false, primaryKey: true, validate: { isEmail: true } },
            // Passwords should be hashed in a real application, but for simplicity, we store them
            // as plain text here. This is NOT secure and should not be used in production.
            password: { type: DataTypes.STRING, allowNull: false },
            is_sales_associate: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
            is_quote_manager: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
            is_purchase_manager: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
            is_admin: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false }
        },
        {
            sequelize,
            modelName: 'Employee',
            tableName: 'employees',
            timestamps: false,
        }
    );

    return Employee;
}