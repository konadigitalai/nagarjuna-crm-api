import { DataTypes, Model, Sequelize } from 'sequelize';
import { sequelize } from '../database';
import User from '../models/user.model';

// Define the attributes for the Meeting model
interface MeetingAttributes {
    id?: number;
    meetingName: string;
    location: string;
    startTime: Date;
    endTime: Date;
    hostId: number;
    userId: number;
    participants?: string[];    
    createdAt?: Date;
    updatedAt?: Date;
}

class Meeting extends Model<MeetingAttributes> implements MeetingAttributes {
    public id!: number;
    public meetingName!: string;
    public location!: string;
    public startTime!: Date;
    public endTime!: Date;
    public hostId!: number;
    public userId!: number;
    public createdAt!: Date;
    public updatedAt!: Date;
    public participants!: string[];
}

Meeting.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    meetingName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    startTime: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    endTime: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    hostId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: User,
            key: 'id'
        }
    },
    participants: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: []
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
    modelName: 'Meeting',
    tableName: 'meetings',
    timestamps: true
});

Meeting.belongsTo(User, { foreignKey: 'hostId', as: 'host' });


export default Meeting;
