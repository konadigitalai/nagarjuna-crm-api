import { DataTypes, Model, Sequelize } from 'sequelize';
import { sequelize } from '../database';
import User from './user.model';

class Communication extends Model {
    public id!: number;
    public title!: string;
    public titleType!: string;
    public description!: string;

    // Define timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Communication.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    titleType: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
}, {
    sequelize,
    modelName: 'Communication',
    tableName: 'communications',
    timestamps: true,
});

export class CommunicationUser extends Model {
    public communicationId!: number;
    public userId!: number;
}

CommunicationUser.init({
    communicationId: {
        type: DataTypes.INTEGER,
        references: {
            model: Communication,
            key: 'id',
        },
        primaryKey: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: 'id',
        },
        primaryKey: true,
    },
}, {
    sequelize,
    modelName: 'CommunicationUser',
    tableName: 'communicationUsers',
    timestamps: false,
});

Communication.belongsToMany(User, { through: CommunicationUser, foreignKey: 'communicationId', as: 'users' });
User.belongsToMany(Communication, { through: CommunicationUser, foreignKey: 'userId', as: 'communications' });

export default Communication;
