import { sequelize } from '../database';

import { DataTypes, Model, Sequelize } from 'sequelize';
import Attendance from './attendance.model';
import Communication from './communication.model';

// Define the attributes for the User model
export interface UserAttributes {
  id?: number;
  profilePicture?: string;
  empId?: string;
  slpId?: string;
  empmId?: string;
  name: string;
  username: string;
  mobile?: string;
  email: string;
  password: string;
  role: string;
  managerId: number;
  currentToken?: string; // Add this field for token management
  tags?: string[]; // Add tags field as optional string array
  createdAt?: Date;
  updatedAt?: Date;
}

// Extend the Model class and specify the UserAttributes interface
class User extends Model<UserAttributes> implements UserAttributes {
  public id!: number;
  public profilePicture?: string;
  public empId?: string;
  public slpId?: string;
  public empmId?: string;
  public name!: string;
  public username!: string;
  public mobile?: string;
  public email!: string;
  public password!: string;
  public role!: string;
  public managerId!: number;
  public currentToken?: string; // Add this field for token management
  public tags?: string[]; // Add tags field as optional string array
  public createdAt!: Date;
  public updatedAt!: Date;
}

// Define the User model and specify the attributes
User.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  profilePicture: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  empId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  slpId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  empmId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mobile: {
    type: DataTypes.STRING
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false
  },
  managerId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  currentToken: { // Add this field for token management
    type: DataTypes.TEXT,
    allowNull: true
  },
  tags: { // Add tags field definition
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true
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
  tableName: 'users',
  timestamps: true
});

// Define associations
User.hasMany(User, { as: 'subordinates', foreignKey: 'managerId' });
User.belongsTo(User, { as: 'manager', foreignKey: 'managerId' });

export default User;