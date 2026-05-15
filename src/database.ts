// import { Pool, QueryResult } from 'pg';
import fs from 'fs';
import path from 'path';
const certPath = path.resolve(__dirname, 'DigiCertGlobalRootCA.crt.pem');
const caCert = fs.readFileSync(certPath, 'utf8');

import { Sequelize } from 'sequelize';

const hostName = process.env.DB_HOST || 'crmedifydb.postgres.database.azure.com';
const portNo = process.env.DB_PORT ? +process.env.DB_PORT : 23403;
const databaseName = process.env.DB_DATABASE || 'nagprod1crmdb';
const username = process.env.DB_USER || 'adminuser';
const password = process.env.DB_PASSWORD || 'Digital!23';
const sequelize = new Sequelize(databaseName, username, password, {
  host: hostName,
  port: portNo,
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      rejectUnauthorized: false,
      ca: caCert,
    },
  },
  logging: false
});

// Check database availability
export async function checkDatabaseAvailability(): Promise<boolean> {
  try {
    await sequelize.authenticate();
    // Sync all models with the database to add the new column
    await sequelize.sync({ alter: true });
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

export { sequelize };