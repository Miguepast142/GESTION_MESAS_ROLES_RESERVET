import { Router } from 'express';
import { AuthService } from './auth.service.js';
import { createSession, destroySession, getSession, parseCookies } from './session.js';

export function createAuthRouter(service: AuthService = new AuthService()): Router {
  const router = Router();

  router.post('/login', async (req, res, next) => {
    try {
      const { username, password } = req.body ?? {};
      const user = await service.login(username, password);
      const session = createSession(user.id, user.username);
      // Same-origin cookie for local dev
      const secure = process.env.NODE_ENV === 'production';
      res.setHeader(
        'Set-Cookie',
        `reservet_session=${encodeURIComponent(session.id)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24}${secure ? '; Secure' : ''}`,
      );
      res.status(200).json({ user: { id: user.id, username: user.username } });
    } catch (error: unknown) {
      const err = error as { name?: string; code?: string; message?: string };
      if (err?.name === 'AuthUnauthorizedError' || err?.code === 'AUTH_UNAUTHORIZED') {
        res.status(401).json({
          code: 'AUTH_UNAUTHORIZED',
          message: 'Credenciales inválidas.',
          requestId: res.locals.requestId,
        });
        return;
      }
      if (err?.name === 'AuthValidationError') {
        res
          .status(400)
          .json({ code: err.code, message: err.message, requestId: res.locals.requestId });
        return;
      }
      next(error);
    }
  });

  router.post('/logout', (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    destroySession(cookies['reservet_session']);
    const secure = process.env.NODE_ENV === 'production';
    res.setHeader(
      'Set-Cookie',
      `reservet_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`,
    );
    res.status(200).json({ ok: true });
  });

  router.get('/me', (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const session = getSession(cookies['reservet_session']);
    if (!session) {
      res
        .status(401)
        .json({ code: 'UNAUTHORIZED', message: 'No autorizado', requestId: res.locals.requestId });
      return;
    }
    res.status(200).json({ user: { id: session.userId, username: session.username } });
  });

  router.post('/register', async (req, res, next) => {
    try {
      const { username, password } = req.body ?? {};
      const user = await service.register(username, password);
      res.status(201).json({ user });
    } catch (error: unknown) {
      const err = error as { name?: string; code?: string; message?: string };
      if (err?.name === 'AuthUnauthorizedError') {
        res
          .status(401)
          .json({ code: err.code, message: err.message, requestId: res.locals.requestId });
        return;
      }
      if (err?.name === 'AuthValidationError') {
        res
          .status(400)
          .json({ code: err.code, message: err.message, requestId: res.locals.requestId });
        return;
      }
      next(error);
    }
  });

  return router;
}

export const authRouter = createAuthRouter();
