import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

export interface LineItemAttributes {
    id:          CreationOptional<number>;
    price:       number;
    description: string;
    quoteId:     number; 
}

export class LineItem extends Model<
    InferAttributes<LineItem>,
    InferCreationAttributes<LineItem, { omit: 'id' }>
> implements LineItemAttributes {
    declare id: CreationOptional<number>;
    declare price: number;
    declare description: string;
    declare quoteId: number;
}

export default function createLineItemModel(sequelize: Sequelize) {
    LineItem.init(
        {
            id:          { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
            price:       { type: DataTypes.DECIMAL(10, 2), allowNull: false },
            description: { type: DataTypes.STRING, allowNull: false },
            
            quoteId:     { type: DataTypes.INTEGER, allowNull: false, references: { model: 'quotes', key: 'id' } },
        },
        {
            sequelize,
            modelName: 'LineItem',
            tableName: 'line_items',
            timestamps: false,
        }
    );

    return LineItem;
}