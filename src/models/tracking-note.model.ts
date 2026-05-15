import { DataTypes, Model, Sequelize } from 'sequelize';
import { sequelize } from '../database';
import TrackingInfo from '../models/tracking.model';

class TrackingNote extends Model {
    public id!: number;
    public description!: string;
    public createdAt!: Date;
    public updatedAt!: Date;
    public trackingInfoId!: number;
}

TrackingNote.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    trackingInfoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: TrackingInfo,
            key: 'id'
        }
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    }
}, {
    sequelize,
    modelName: 'TrackingNote',
    tableName: 'trackingNotes'
});

export default TrackingNote;