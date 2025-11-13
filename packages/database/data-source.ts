import { DataSource, DataSourceOptions } from 'typeorm';
import * as entities from './entities';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env file from package root
config({ path: resolve(__dirname, '../.env') });

const getDataSourceOptions = (): DataSourceOptions => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Parse Oracle connection string
  // Format: oracle://user:password@host:port/service_name
  // or: oracle://user:password@host:port/SID
  const url = new URL(databaseUrl);
  
  const host = url.hostname;
  const port = parseInt(url.port || '1521', 10);
  const username = url.username;
  const password = url.password;
  const path = url.pathname.replace('/', ''); // Remove leading /
  
  // Check if it's a SID (single word, typically XE) or service name
  // XEPDB1 is a service name, not SID
  // SID is typically short (2-8 chars) and uppercase, service names can be longer
  const isSid = path.length <= 3 && path === path.toUpperCase() && !path.includes('.');
  const config: any = {
    type: 'oracle',
    username,
    password,
  };
  
  // Try using connectString (easy connect format) for better compatibility
  // Format: host:port/service_name or host:port/SID
  const connectString = `${host}:${port}/${path}`;
  config.connectString = connectString;
  
  // Also set host/port/serviceName or sid as fallback
  config.host = host;
  config.port = port;
  if (isSid) {
    config.sid = path;
  } else {
    config.serviceName = path;
  }

  return {
    ...config,
    synchronize: false, // Never use synchronize in production
    logging: process.env.NODE_ENV === 'development',
    entities: Object.values(entities),
    migrations: [process.env.NODE_ENV === 'production' ? 'migrations/**/*.js' : 'migrations/**/*.ts'],
    migrationsTableName: 'migrations',
    extra: {
      max: 10, // Connection pool size
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },
  };
};

export const AppDataSource = new DataSource(getDataSourceOptions());

