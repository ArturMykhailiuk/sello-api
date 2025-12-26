import path from "node:path";

import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export const settings = {
  dbPassword: process.env.POSTGRES_PASSWORD,
  dbUsername: process.env.POSTGRES_USER,
  dbName: process.env.POSTGRES_DB,
  dbPort: process.env.DB_PORT,
  dbHost: process.env.DB_HOST,

  env: process.env.NODE_ENV || "development",
  tokenSecret: process.env.TOKEN_SECRET,

  port: process.env.PORT,

  apiURL: process.env.API_URL,

  n8nBaseUrl: process.env.N8N_BASE_URL || "https://n8n.sell-o.shop",
  n8nAdminKey: process.env.N8N_ADMIN_KEY,
  encryptionKey: process.env.ENCRYPTION_KEY,
};

const validateSettings = () => {
  const requiredKeys = [
    "dbPassword",
    "dbUsername",
    "dbName",
    "dbPort",
    "dbHost",
    "env",
    "tokenSecret",
    "port",
    "apiURL",
  ];

  for (const key of requiredKeys) {
    if (settings[key] === undefined) {
      throw new Error(`.env doesn't have ${key}`);
    }
  }
};

validateSettings();
