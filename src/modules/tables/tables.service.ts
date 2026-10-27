import { TablesRepository } from './tables.repository.js';

export class TableConflictError extends Error {
  code = 'TABLE_NAME_CONFLICT';
  constructor(message = 'Ya existe una mesa con este nombre.') {
    super(message);
    this.name = 'TableConflictError';
  }
}

export class TableNotFoundError extends Error {
  code = 'TABLE_NOT_FOUND';
  constructor(message = 'Mesa no encontrada.') {
    super(message);
    this.name = 'TableNotFoundError';
  }
}

export class TableValidationError extends Error {
  code = 'TABLE_VALIDATION_ERROR';
  constructor(message = 'Datos de mesa inválidos.') {
    super(message);
    this.name = 'TableValidationError';
  }
}

const ALLOWED_STATUSES = ['available', 'occupied', 'out_of_service'] as const;

export class TablesService {
  constructor(private readonly repository: TablesRepository = new TablesRepository()) {}

  async listTables() {
    return this.repository.findAll();
  }

  async createTable(input: unknown) {
    if (!input || typeof input !== 'object') {
      throw new TableValidationError();
    }
    const { name, capacity } = input as Record<string, unknown>;

    if (typeof name !== 'string') {
      throw new TableValidationError();
    }
    const trimmedName = name.trim();
    if (trimmedName.length === 0 || trimmedName.length > 80) {
      throw new TableValidationError();
    }
    if (!Number.isInteger(capacity)) {
      throw new TableValidationError();
    }
    const cap = capacity as number;
    if (cap < 1 || cap > 20) {
      throw new TableValidationError();
    }

    const existing = await this.repository.findByName(trimmedName);
    if (existing) {
      throw new TableConflictError();
    }

    try {
      return await this.repository.create(trimmedName, cap);
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err?.code === '23505') {
        throw new TableConflictError();
      }
      throw error;
    }
  }

  async updateTableStatus(id: unknown, input: unknown) {
    const tableId = Number(id);
    if (!Number.isInteger(tableId) || tableId <= 0) {
      throw new TableValidationError('Identificador de mesa inválido.');
    }
    if (!input || typeof input !== 'object') {
      throw new TableValidationError();
    }
    const { status } = input as Record<string, unknown>;
    if (typeof status !== 'string' || !(ALLOWED_STATUSES as readonly string[]).includes(status)) {
      throw new TableValidationError('Estado inválido.');
    }

    const updated = await this.repository.updateStatus(tableId, status);
    if (!updated) {
      throw new TableNotFoundError();
    }
    return updated;
  }
}
