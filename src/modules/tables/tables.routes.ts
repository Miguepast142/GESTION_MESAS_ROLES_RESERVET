import { Router } from 'express';
import { TablesService } from './tables.service.js';
import { TableConflictError, TableNotFoundError, TableValidationError } from './tables.service.js';

export function createTablesRouter(service: TablesService = new TablesService()): Router {
  const router = Router();

  router.get('/', async (_req, res, next) => {
    try {
      const tables = await service.listTables();
      res.status(200).json(tables);
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const table = await service.createTable(req.body);
      res.status(201).json(table);
    } catch (error) {
      if (error instanceof TableValidationError) {
        res.status(400).json({
          code: error.code ?? 'TABLE_VALIDATION_ERROR',
          message: error.message,
          requestId: res.locals.requestId,
        });
        return;
      }
      if (error instanceof TableConflictError) {
        res.status(409).json({
          code: error.code ?? 'TABLE_NAME_CONFLICT',
          message: error.message,
          requestId: res.locals.requestId,
        });
        return;
      }
      next(error);
    }
  });

  router.patch('/:id/status', async (req, res, next) => {
    try {
      const table = await service.updateTableStatus(req.params.id, req.body);
      res.status(200).json(table);
    } catch (error) {
      if (error instanceof TableValidationError) {
        res.status(400).json({
          code: error.code ?? 'TABLE_VALIDATION_ERROR',
          message: error.message,
          requestId: res.locals.requestId,
        });
        return;
      }
      if (error instanceof TableNotFoundError) {
        res.status(404).json({
          code: error.code ?? 'TABLE_NOT_FOUND',
          message: error.message,
          requestId: res.locals.requestId,
        });
        return;
      }
      next(error);
    }
  });

  return router;
}

export const tablesRouter = createTablesRouter();
