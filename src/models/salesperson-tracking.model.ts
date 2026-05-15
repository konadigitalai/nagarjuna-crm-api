import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../database';
import User from './user.model';

class SalesPersonTrackingInfo extends Model {
    public id!: number;
    public latitude!: number;
    public longitude!: number;
    public address!: string;
    userId: any;
}

SalesPersonTrackingInfo.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    latitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    longitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
}, {
    sequelize,
    modelName: 'SalesPersonTrackingInfo',
    tableName: 'salesPersonTrackingInfo',
});

// Define the association
SalesPersonTrackingInfo.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default SalesPersonTrackingInfo;
