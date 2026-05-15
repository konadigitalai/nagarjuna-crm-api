import { DataTypes, Model, Sequelize } from 'sequelize';
import { sequelize } from '../database';
import TrackingInfo from './tracking.model';

class TrackingImage extends Model {
    public id!: number;
    public imgSrc!: string;
    public type!: string;
    public createdAt!: Date;
    public updatedAt!: Date;
    public trackingInfoId!: number;
}

TrackingImage.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    imgSrc: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    type: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isIn: [['image', 'document']]
        }
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
    modelName: 'TrackingImage',
    tableName: 'trackingImages'
});

export default TrackingImage;
