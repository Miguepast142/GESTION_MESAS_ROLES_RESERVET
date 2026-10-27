import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { pool } from '../src/shared/database.js';

const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

async function main() {
  const username = process.env.SEED_USER || 'demo';
  const password = process.env.SEED_PASSWORD || 'demo1234';
  const client = await pool.connect();
  try {
    const hash = await hashPassword(password);
    await client.query(
      `INSERT INTO users (username, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [username, hash],
    );
    console.log(`Usuario creado/actualizado: ${username}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Error al crear usuario:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
