import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { AuthRepository } from './auth.repository.js';

const scryptAsync = promisify(crypto.scrypt);

export class AuthValidationError extends Error {
  code = 'AUTH_VALIDATION_ERROR';
  constructor(message = 'Datos de autenticación inválidos.') {
    super(message);
    this.name = 'AuthValidationError';
  }
}

export class AuthUnauthorizedError extends Error {
  code = 'AUTH_UNAUTHORIZED';
  constructor(message = 'No autorizado.') {
    super(message);
    this.name = 'AuthUnauthorizedError';
  }
}

export class AuthService {
  constructor(private readonly repository: AuthRepository = new AuthRepository()) {}

  private async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16);
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
  }

  private async verifyPassword(password: string, stored: string): Promise<boolean> {
    try {
      const [saltHex, keyHex] = stored.split(':');
      if (!saltHex || !keyHex) return false;
      const salt = Buffer.from(saltHex, 'hex');
      const key = Buffer.from(keyHex, 'hex');
      const derivedKey = (await scryptAsync(password, salt, key.length)) as Buffer;
      return crypto.timingSafeEqual(key, derivedKey);
    } catch {
      return false;
    }
  }

  async register(username: string, password: string) {
    if (typeof username !== 'string' || typeof password !== 'string') {
      throw new AuthValidationError();
    }
    const trimmed = username.trim();
    if (trimmed.length === 0 || trimmed.length > 80) {
      throw new AuthValidationError();
    }
    if (password.length < 4) {
      throw new AuthValidationError('La contraseña debe tener al menos 4 caracteres.');
    }
    const existing = await this.repository.findByUsername(trimmed);
    if (existing) {
      // Don't leak whether user exists
      throw new AuthUnauthorizedError('Credenciales inválidas.');
    }
    const passwordHash = await this.hashPassword(password);
    const user = await this.repository.createUser(trimmed, passwordHash);
    return { id: user.id, username: user.username };
  }

  async login(username: string, password: string) {
    if (typeof username !== 'string' || typeof password !== 'string') {
      throw new AuthUnauthorizedError('Credenciales inválidas.');
    }
    const user = await this.repository.findByUsername(username);
    if (!user) {
      throw new AuthUnauthorizedError('Credenciales inválidas.');
    }
    const valid = await this.verifyPassword(password, user.password_hash);
    if (!valid) {
      throw new AuthUnauthorizedError('Credenciales inválidas.');
    }
    return { id: user.id, username: user.username };
  }
}
