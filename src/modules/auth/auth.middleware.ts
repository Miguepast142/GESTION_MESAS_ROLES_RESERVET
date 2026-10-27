import { Request, Response, NextFunction } from 'express';
import { getSession, parseCookies } from './session.js';

interface AuthenticatedRequest extends Request {
  user?: unknown;
  sessionId?: string;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const cookies = parseCookies(req.headers.cookie);
  const session = getSession(cookies['reservet_session']);
  if (!session) {
    res
      .status(401)
      .json({ code: 'UNAUTHORIZED', message: 'No autorizado', requestId: res.locals.requestId });
    return;
  }
  (req as AuthenticatedRequest).user = session;
  (req as AuthenticatedRequest).sessionId = session.id;
  next();
}

export function attachUser(req: Request, _res: Response, next: NextFunction) {
  const cookies = parseCookies(req.headers.cookie);
  const session = getSession(cookies['reservet_session']);
  if (session) {
    (req as AuthenticatedRequest).user = session;
    (req as AuthenticatedRequest).sessionId = session.id;
  }
  next();
}
