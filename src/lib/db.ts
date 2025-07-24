import pg from 'pg';
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: 'postgres',
  logging: false,
  dialectModule: pg,
});
export default sequelize;
