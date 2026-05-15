import { DataTypes, Model, Sequelize } from 'sequelize';
import { sequelize } from '../database';
import User from './user.model';

class WpMessage extends Model {
    public id!: number;
    public userId!: number;
    public message!: string;

    // Define timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

WpMessage.init({
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
    msgId: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    msgStatus: {
        type: DataTypes.TEXT,
        allowNull: false,
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
    modelName: 'WpMessage',
    tableName: 'wpMessage',
    timestamps: true,
});

WpMessage.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default WpMessage;