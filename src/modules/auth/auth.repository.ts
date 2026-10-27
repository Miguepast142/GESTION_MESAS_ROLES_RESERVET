import { pool } from '../../shared/database.js';

export type UserRow = {
  id: number;
  username: string;
  password_hash: string;
};

export class AuthRepository {
  async findByUsername(username: string): Promise<UserRow | null> {
    const result = await pool.query<UserRow>(
      'SELECT id, username, password_hash FROM users WHERE lower(username) = lower($1)',
      [username],
    );
    return result.rows[0] ?? null;
  }

  async createUser(username: string, passwordHash: string): Promise<UserRow> {
    const result = await pool.query<UserRow>(
      `INSERT INTO users (username, password_hash)
       VALUES ($1, $2)
       RETURNING id, username, password_hash`,
      [username.trim(), passwordHash],
    );
    return result.rows[0];
  }
}
