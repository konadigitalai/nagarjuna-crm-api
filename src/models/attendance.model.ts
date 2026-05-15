import { DataTypes, Model, Sequelize } from 'sequelize';
import { sequelize } from '../database';
import User from '../models/user.model';

// Define the attributes for the Attendance model
interface AttendanceAttributes {
    id?: number;
    userId: number;
    clockIn: Date;
    clockOut: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}

class Attendance extends Model<AttendanceAttributes> implements AttendanceAttributes {
    public id!: number;
    public userId!: number;
    public clockIn!: Date;
    public clockOut!: Date | null;
    public createdAt!: Date;
    public updatedAt!: Date;
}

Attendance.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "users",
            key: 'id'
        }
    },
    clockIn: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    clockOut: {
        type: DataTypes.DATE,
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
    modelName: 'Attendance',
    tableName: 'attendances',
    timestamps: true
});

Attendance.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default Attendance;