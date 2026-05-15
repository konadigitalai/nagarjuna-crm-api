import { DataTypes, Model, Sequelize } from 'sequelize';
import { sequelize } from '../database';
import User from './user.model';

class GroupMessage extends Model {
    public id!: number;
    public userId!: number;
    public tempName!: string;

    // Define timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

GroupMessage.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: User,
            key: 'id'
        }
    },
    tempName: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    groupId: {
        type: DataTypes.ARRAY(DataTypes.STRING),  // Array of strings
        allowNull: false,
        defaultValue: []
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false,
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false,
    }
}, {
    sequelize,
    modelName: 'GroupMessage',
    tableName: 'groupMessage',
    timestamps: true,
});

GroupMessage.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default GroupMessage;