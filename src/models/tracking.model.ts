import { DataTypes, Model, Sequelize } from "sequelize";
import { sequelize } from "../database";
import TrackingNote from "./tracking-note.model";
import TrackingImage from "./tracking-image.model";
import User from "./user.model";
import Dealer from "./contact.model";

class TrackingInfo extends Model {
  public id!: number;
  public latitude!: number;
  public longitude!: number;
  public address!: string;
  public trackingType!: string;
  public updatedAt!: Date;
  userId: any;
  dealerId: any;
  public distance!: number;
  public createdAt!: Date;

  // public updatedAt!: Date;
}

TrackingInfo.init(
  {
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
    trackingType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [["auto", "captured"]],
      },
    },
    dealerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Dealer,
        key: "id",
      },
    },
    distance: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    createdAt: {
      type: DataTypes.DATE,

      //     allowNull: false,
      //     defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      // },
      // updatedAt: {
      //     type: DataTypes.DATE,
      //     allowNull: false,
      //     defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),

      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
  },
  {
    sequelize,
    modelName: "TrackingInfo",
    tableName: "trackingInfo",
  }
);

// Define the association
TrackingInfo.hasMany(TrackingNote, {
  foreignKey: "trackingInfoId",
  as: "trackingNotes",
});
TrackingInfo.hasMany(TrackingImage, {
  foreignKey: "trackingInfoId",
  as: "trackingImages",
});
TrackingInfo.belongsTo(User, { foreignKey: "userId", as: "user" });
TrackingInfo.belongsTo(Dealer, { foreignKey: "dealerId", as: "dealer" });

export default TrackingInfo;
