import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';

const resolveEnvName = () => {
  const raw = process.env.APP_ENV ?? process.env.NODE_ENV ?? 'dev';
  if (raw === 'development') return 'dev';
  if (raw === 'production') return 'prod';
  if (raw === 'test') return 'test';
  if (raw === 'local') return 'local';
  return raw;
};

const readEnvFile = (filename: string) => {
  const filepath = resolve(process.cwd(), filename);
  if (!existsSync(filepath)) {
    return {} as Record<string, string>;
  }
  const content = readFileSync(filepath, 'utf-8');
  return dotenv.parse(content);
};

export const loadEnv = () => {
  const envName = resolveEnvName();
  const envBase = readEnvFile('.env');
  const envSpecific = readEnvFile(`.env.${envName}`);

  const merged = { ...envBase, ...envSpecific };

  Object.entries(merged).forEach(([key, value]) => {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
};
