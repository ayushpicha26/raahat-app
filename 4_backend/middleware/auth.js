/**
 * middleware/auth.js — JWT Authentication Middleware
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = '1h';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required.');
}

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Express middleware — attaches req.user if valid JWT is present.
 * Does NOT reject unauthenticated requests (use requireAuth for that).
 */
export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const token = header.slice(7);
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
}

/**
 * Express middleware — rejects request if not authenticated.
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please login.' });
  }
  next();
}

/**
 * Express middleware — rejects request if not an admin.
 */
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

/**
 * Generate a 6-digit OTP (not logged to console).
 */
export function generateOTP() {
  return String(crypto.randomInt(100000, 1000000));
}

/**
 * Hash an OTP for storage.
 */
export function hashOTP(otp) {
  return bcrypt.hashSync(otp, 10);
}

/**
 * Verify a plain OTP against a stored hash.
 */
export function verifyOTP(otp, hash) {
  return bcrypt.compareSync(otp, hash);
}

/**
 * Returns a lockout timestamp if the account is currently locked,
 * or null otherwise.
 */
export async function getLockout(db, role, identifier) {
  const row = await db.get(
    role === 'admin'
      ? 'SELECT locked_until FROM admins WHERE officer_id = $1'
      : 'SELECT locked_until FROM users WHERE mobile = $1 OR email = $2',
    role === 'admin' ? [identifier] : [identifier, identifier]
  );

  if (!row || !row.locked_until) return null;
  return new Date(row.locked_until) > new Date() ? row.locked_until : null;
}

/**
 * Increments failed login attempts. Locks account after 5 failures
 * for 15 minutes. Returns { locked: true|false }.
 */
export async function recordFailedLogin(db, role, identifier) {
  const lockoutMs = 15 * 60 * 1000;
  if (role === 'admin') {
    const row = await db.get('SELECT failed_login_attempts, locked_until FROM admins WHERE officer_id = $1', [identifier]);
    if (!row) return { locked: false };
    const attempts = (row.failed_login_attempts || 0) + 1;
    let locked = false;
    let locked_until = null;
    if (attempts >= 5) {
      locked_until = new Date(Date.now() + lockoutMs).toISOString();
      locked = true;
    }
    await db.query(
      'UPDATE admins SET failed_login_attempts = $1, locked_until = $2 WHERE officer_id = $3',
      [attempts, locked_until, identifier]
    );
    return { locked };
  }
  const row = await db.get('SELECT failed_login_attempts, locked_until FROM users WHERE mobile = $1 OR email = $2', [identifier, identifier]);
  if (!row) return { locked: false };
  const attempts = (row.failed_login_attempts || 0) + 1;
  let locked = false;
  let locked_until = null;
  if (attempts >= 5) {
    locked_until = new Date(Date.now() + lockoutMs).toISOString();
    locked = true;
  }
  await db.query(
    'UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE mobile = $3 OR email = $4',
    [attempts, locked_until, identifier, identifier]
  );
  return { locked };
}

/** Resets failed login attempts after a successful login. */
export async function resetFailedLogins(db, role, identifier) {
  if (role === 'admin') {
    await db.query('UPDATE admins SET failed_login_attempts = 0, locked_until = NULL WHERE officer_id = $1', [identifier]);
    return;
  }
  await db.query('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE mobile = $1 OR email = $2', [identifier, identifier]);
}

/**
 * Stores a hashed OTP with expiry on a user row.
 */
export async function storeUserOTP(db, mobile, otp, expiresMinutes = 5) {
  const hash = hashOTP(otp);
  const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000).toISOString();
  await db.query('UPDATE users SET otp_hash = $1, otp_expires_at = $2 WHERE mobile = $3', [hash, expiresAt, mobile]);
}

/**
 * Verifies a stored OTP and clears it once used (or expired).
 * Returns true when OTP matches and is not expired.
 */
export async function consumeUserOTP(db, mobile, otp) {
  const row = await db.get('SELECT otp_hash, otp_expires_at FROM users WHERE mobile = $1', [mobile]);
  if (!row || !row.otp_hash) return false;
  if (new Date(row.otp_expires_at) < new Date()) {
    await db.query('UPDATE users SET otp_hash = NULL, otp_expires_at = NULL WHERE mobile = $1', [mobile]);
    return false;
  }
  if (!verifyOTP(otp, row.otp_hash)) return false;
  await db.query('UPDATE users SET otp_hash = NULL, otp_expires_at = NULL WHERE mobile = $1', [mobile]);
  return true;
}
