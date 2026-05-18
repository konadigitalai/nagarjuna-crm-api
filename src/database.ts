import 'pg';
import fs from 'fs';
import path from 'path';
import { Sequelize } from 'sequelize';

let sequelize: Sequelize | null = null;

function getEnv() {
  const host = process.env.DB_HOST;
  const database = process.env.DB_DATABASE;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432;

  if (!host || !database || !user || !password) {
    throw new Error(
      'Database environment variables (DB_HOST, DB_DATABASE, DB_USER, DB_PASSWORD) are not configured'
    );
  }

  return { host, database, user, password, port };
}

function createSequelize() {
  const { host, database, user, password, port } = getEnv();

  const certPath = path.resolve(__dirname, 'DigiCertGlobalRootCA.crt.pem');

  let caCert: string | undefined;
  try {
    caCert = fs.readFileSync(certPath, 'utf8');
  } catch {
    caCert = undefined;
  }

  return new Sequelize(database, user, password, {
    host,
    port,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false,
        ...(caCert ? { ca: caCert } : {}),
      },
    },
  });
}

/* Lazy initialization */
export function getSequelize() {
  if (!sequelize) {
    sequelize = createSequelize();
  }
  return sequelize;
}

/* DB check */
export async function checkDatabaseAvailability(): Promise<boolean> {
  try {
    const db = getSequelize();

    await db.authenticate();
    await db.sync({ alter: true });

    return true;
  } catch (error) {
    console.log('DB Error:', error);
    return false;
  }
}

/* optional export (only if needed elsewhere) */
export { sequelize };