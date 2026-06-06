import path from 'node:path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll } from 'vitest';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

process.env.NODE_ENV = 'test';
process.env.CLIENT_URL ??= 'http://localhost:4200';
process.env.ACCESS_TOKEN_SECRET ??= 'test-access-token-secret-at-least-32-characters';
process.env.REFRESH_TOKEN_SECRET ??= 'test-refresh-token-secret-at-least-32-characters';
process.env.ACCESS_TOKEN_EXPIRES_IN ??= '15m';
process.env.REFRESH_TOKEN_EXPIRES_IN ??= '7d';

const fallbackTestDbName = 'eminence_tasks_test';

const getDatabaseName = (uri: string): string => {
  const parsedUri = new URL(uri);
  return parsedUri.pathname.replace(/^\//, '');
};

const setDatabaseName = (uri: string, databaseName: string): string => {
  const parsedUri = new URL(uri);
  parsedUri.pathname = `/${databaseName}`;
  return parsedUri.toString();
};

const createTestMongoUri = (): string => {
  const explicitTestUri = process.env.TEST_MONGODB_URI;

  if (explicitTestUri) {
    const explicitDbName = getDatabaseName(explicitTestUri);
    const normalizedUri = explicitDbName ? explicitTestUri : setDatabaseName(explicitTestUri, fallbackTestDbName);
    const normalizedDbName = getDatabaseName(normalizedUri);

    if (!/test/i.test(normalizedDbName)) {
      throw new Error('TEST_MONGODB_URI database name must include "test" to prevent accidental data cleanup.');
    }

    return normalizedUri;
  }

  const sourceUri = process.env.MONGODB_URI;

  if (!sourceUri) {
    throw new Error('Set TEST_MONGODB_URI or MONGODB_URI before running backend tests.');
  }

  const sourceDbName = getDatabaseName(sourceUri) || 'eminence_tasks';
  const testDbName = /test/i.test(sourceDbName) ? sourceDbName : `${sourceDbName}_test`;

  return setDatabaseName(sourceUri, testDbName);
};

process.env.MONGODB_URI = createTestMongoUri();

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);
  await mongoose.connection.dropDatabase();
});

afterEach(async () => {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
