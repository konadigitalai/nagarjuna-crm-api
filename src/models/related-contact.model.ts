import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../database';
import Dealer from './contact.model';

class RelatedContact extends Model {
  public id!: number;
  public dealerId!: number;
  public name!: string;
  public phone!: string | null;
  public email!: string | null;
  public designation!: string | null;
  public gstNumber!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RelatedContact.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  dealerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Dealer,
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING
  },
  email: {
    type: DataTypes.STRING
  },
  designation: {
    type: DataTypes.STRING
  }
}, {
  sequelize,
  modelName: 'RelatedContact',
  tableName: 'relatedContacts',
  timestamps: true
});

export default RelatedContact;