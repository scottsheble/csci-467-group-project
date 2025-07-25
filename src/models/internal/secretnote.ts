import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

export interface SecretNoteAttributes {
    id: CreationOptional<number>;
    content: string;
    quoteId: number;
}

export class SecretNote extends Model<
    InferAttributes<SecretNote>,
    InferCreationAttributes<SecretNote, { omit: 'id' }>
> implements SecretNoteAttributes {
    declare id: CreationOptional<number>;
    declare content: string;
    declare quoteId: number;
}

export default function createSecretNoteModel(sequelize: Sequelize) {
    SecretNote.init(
        {
            id: {  type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
            content: { type: DataTypes.TEXT, allowNull: false },
            quoteId: { 
                type: DataTypes.INTEGER,
                allowNull: false, 
                references: { 
                    model: 'quotes', 
                    key: 'id' 
                } 
            },
        },
        {
            sequelize,
            modelName: 'SecretNote',
            tableName: 'secret_notes',
            timestamps: true, // Enables createdAt and updatedAt
        }
    );

    return SecretNote;
}
