import { randomUUID } from 'node:crypto';

export type Session = {
  id: string;
  userId: number;
  username: string;
  expiresAt: number;
};

const sessions = new Map<string, Session>();
const SESSION_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

export function createSession(userId: number, username: string): Session {
  const id = randomUUID();
  const session: Session = {
    id,
    userId,
    username,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  sessions.set(id, session);
  return session;
}

export function getSession(sessionId: string | undefined): Session | null {
  if (!sessionId) return null;
  const session = sessions.get(sessionId);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    sessions.delete(sessionId);
    return null;
  }
  return session;
}

export function destroySession(sessionId: string | undefined): void {
  if (!sessionId) return;
  sessions.delete(sessionId);
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (!name) continue;
    cookies[name] = decodeURIComponent(rest.join('='));
  }
  return cookies;
}
