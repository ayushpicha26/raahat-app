import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'raahat-dev-secret-change-in-production';
const JWT_EXPIRY = '24h';

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
 * Generate a 6-digit OTP (for demo — logs to console).
 */
export function generateOTP(mobile) {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  console.log(`📱 OTP for ${mobile}: ${otp} (demo mode — would send via SMS in production)`);
  return otp;
}
