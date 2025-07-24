import { DataTypes, Model } from 'sequelize';
import sequelize from '@/lib/db';

class Example extends Model {}
Example.init(
  { text: { type: DataTypes.STRING, allowNull: false } },
  { sequelize, modelName: 'Example' }
);
export default Example;
