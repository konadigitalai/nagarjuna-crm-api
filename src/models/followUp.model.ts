import { sequelize } from "../database";
import { DataTypes, Model, Sequelize } from "sequelize";
import Dealer from "./contact.model"; // Assuming a Dealer model exists
import User from "./user.model"; // Assuming a User model exists

// Define the attributes for the FollowUp model
export interface FollowUpAttributes {
  id?: number;
  dealerId: number;
  userId: number;
  delete?: number;
  followUpDate: Date;
  notes?: string;
  status: "pending" | "done";
  createdAt?: Date;
  updatedAt?: Date;
}

// Extend the Model class and specify the FollowUpAttributes interface
class FollowUp extends Model<FollowUpAttributes> implements FollowUpAttributes {
  public id!: number;
  public dealerId!: number;
  public userId!: number;
  public delete!: number;
  public followUpDate!: Date;
  public notes?: string;
  public status!: "pending" | "done";
  public createdAt!: Date;
  public updatedAt!: Date;
}

// Define the FollowUp model and specify the attributes
FollowUp.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    dealerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Dealer,
        key: "id",
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    delete: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    followUpDate: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    notes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "done"),
      allowNull: false,
      defaultValue: "pending",
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
  },
  {
    sequelize,
    tableName: "followUps",
    timestamps: true,
  }
);

// Define associations
FollowUp.belongsTo(Dealer, { as: "dealer", foreignKey: "dealerId" });
FollowUp.belongsTo(User, { as: "user", foreignKey: "userId" });

export default FollowUp;
