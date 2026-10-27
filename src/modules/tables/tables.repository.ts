import { pool } from '../../shared/database.js';

export type TableRow = {
  id: number;
  name: string;
  capacity: number;
  status: 'available' | 'occupied' | 'out_of_service';
};

export class TablesRepository {
  async findAll(): Promise<TableRow[]> {
    const result = await pool.query<TableRow>(
      'SELECT id, name, capacity, status FROM restaurant_tables ORDER BY id ASC',
    );
    return result.rows;
  }

  async findById(id: number): Promise<TableRow | null> {
    const result = await pool.query<TableRow>(
      'SELECT id, name, capacity, status FROM restaurant_tables WHERE id = $1',
      [id],
    );
    return result.rows[0] ?? null;
  }

  async findByName(name: string): Promise<TableRow | null> {
    const result = await pool.query<TableRow>(
      'SELECT id, name, capacity, status FROM restaurant_tables WHERE lower(trim(name)) = lower(trim($1))',
      [name],
    );
    return result.rows[0] ?? null;
  }

  async create(name: string, capacity: number): Promise<TableRow> {
    const result = await pool.query<TableRow>(
      `INSERT INTO restaurant_tables (name, capacity, status)
       VALUES ($1, $2, 'available')
       RETURNING id, name, capacity, status`,
      [name.trim(), capacity],
    );
    return result.rows[0];
  }

  async updateStatus(id: number, status: string): Promise<TableRow | null> {
    const result = await pool.query<TableRow>(
      `UPDATE restaurant_tables SET status = $2 WHERE id = $1
       RETURNING id, name, capacity, status`,
      [id, status],
    );
    return result.rows[0] ?? null;
  }
}
