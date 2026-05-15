import { DataTypes, Model, Sequelize } from 'sequelize';

import { sequelize } from '../database';
import RelatedContact from './related-contact.model';
import User from '../models/user.model';

export interface DealerCountResult {
  userId: number;
  contactType: 'customer' | 'dealer' | 'fabricator';
  count: number;
}
export interface DealerAttributes {
  id?: number;
  personName: string,
  companyName: string;
  phone: string;
  phone2: string;
  landline: string;
  email: string;
  contactType: string;
  address: string;
  description: string;
  userId?: number;
  displayPicture?: string;
  gstNumber: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the User model and specify the attributes
class Dealer extends Model<DealerAttributes> implements DealerAttributes {
  public id!: number;
  public personName!: string;
  public companyName!: string;
  public phone!: string;
  public phone2!: string;
  public landline!: string;
  public email!: string;
  public contactType!: string;
  public address!: string;
  public description!: string;
  public userId?: number;
  public displayPicture?: string;
  public gstNumber!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Dealer.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  personName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone2: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  landline: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  contactType: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['fabricator', 'customer', 'dealer','engineers','masons']], // Allow only fabricator, customer, or dealer
    },
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  gstNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
        model: User,
        key: 'id'
    }
  },
  displayPicture: {
    type: DataTypes.STRING,
    allowNull: true,
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
  },
}, {
  sequelize,
  modelName: 'Dealer',
  tableName: 'dealers',
});

// Define the association with RelatedContact
Dealer.hasMany(RelatedContact, { foreignKey: 'dealerId', as: 'relatedContacts' });
Dealer.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default Dealer;
