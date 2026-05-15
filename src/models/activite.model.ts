import { DataTypes, Model, Sequelize } from "sequelize";
import { sequelize } from "../database";
import User from "../models/user.model";

// Define the attributes for the Attendance model
interface ActiviteAttributes {
  id?: number;
  userId: number;
  subject: string;
  priority: string;
  dueDate?: Date | null;
  dealerId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

class Activite extends Model<ActiviteAttributes> implements ActiviteAttributes {
  public id!: number;
  public userId!: number;
  public subject!: string;
  public priority!: string;
  public dueDate!: Date | null;
  public dealerId!: number; // Add this field
  public createdAt!: Date;
  public updatedAt!: Date;
}

Activite.init(
  {
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
        key: "id",
      },
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    priority: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [["active", "inactive"]], // Allow only active, or inactive
      },
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
     dealerId: {
      type: DataTypes.INTEGER,
      allowNull: false, // Make sure this aligns with your database schema
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
    modelName: "Activite",
    tableName: "activityTasks",
    timestamps: true,
  }
);

Activite.belongsTo(User, { foreignKey: "userId", as: "user" });

export default Activite;
