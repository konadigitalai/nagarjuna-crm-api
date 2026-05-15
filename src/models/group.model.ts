import { DataTypes, Model, Sequelize } from 'sequelize';
import { sequelize } from '../database';

class Group extends Model {
  public id!: number;
  public groupName!: string;
  public description!: string;
  public category!: string;
  public contactIds!: number[];  // store as array
  public status!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Group.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    groupName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contactIds: {
      type: DataTypes.JSON, // store user IDs as JSON array
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'Active',
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  },
  {
    sequelize,
    modelName: 'Group',
    tableName: 'groups',
    timestamps: true,
  }
);

export default Group;
