import 'pg';
import fs from 'fs';
import path from 'path';
import { Sequelize } from 'sequelize';

const certPath = path.resolve(__dirname, 'DigiCertGlobalRootCA.crt.pem');
let caCert: string | undefined;
try {
  caCert = fs.readFileSync(certPath, 'utf8');
} catch {
  caCert = undefined;
}

const hostName = process.env.DB_HOST;
const portNo = process.env.DB_PORT ? +process.env.DB_PORT : 5432;
const databaseName = process.env.DB_DATABASE;
const username = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
if (!hostName || !databaseName || !username || !password) {
  throw new Error('Database environment variables (DB_HOST, DB_DATABASE, DB_USER, DB_PASSWORD) are not configured');
}
const sequelize = new Sequelize(databaseName, username, password, {
  host: hostName,
  port: portNo,
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      rejectUnauthorized: false,
      ...(caCert ? { ca: caCert } : {}),
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