/**
 * routes/auth.js — Authentication Routes (PostgreSQL)
 *
 * Handles: registration, login, OTP, profile management
 * Uses JWT tokens
 */

import { Router } from 'express';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  requireAuth,
  generateOTP,
  getLockout,
  recordFailedLogin,
  resetFailedLogins,
  storeUserOTP,
  consumeUserOTP
} from '../middleware/auth.js';
import { validateRegisterInput, validateLoginInput } from '../middleware/validation.js';
import { logAudit } from '../utils/audit_logger.js';

const router = Router();

// ── POST /api/auth/register ──
router.post('/register', validateRegisterInput, async (req, res) => {
  const { name, mobile, email, password, dob, state, district, category, language, address } = req.body;
  const db = req.app.locals.db;

  const caseId = `RAH-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const cleanDob = (dob && typeof dob === 'string' && dob.trim()) ? dob.trim() : null;

  let userId;
  try {
    const result = await db.run(`
      INSERT INTO users (name, mobile, email, password_hash, dob, state, district, category, language, address, case_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [
      name,
      mobile || null,
      email || null,
      hashPassword(password),
      cleanDob,
      state || 'Maharashtra',
      district || '',
      category || '',
      language || 'English',
      address || '',
      caseId
    ]);
    userId = result.lastInsertRowid || result.rows?.[0]?.id;
  } catch (err) {
    if (err.code === '23505') { // PostgreSQL unique constraint violation
      return res.status(409).json({ error: 'This mobile number or email is already registered.' });
    }
    throw err;
  }

  // Generate and send a one‑time password for immediate verification (mobile only).
  if (mobile) {
    const otp = generateOTP();
    await storeUserOTP(db, mobile, otp, 5); // 5‑minute expiry
  }

  const token = generateToken({ id: userId, role: 'citizen', name, caseId });

  await logAudit(db, 'USER_REGISTERED', 'user', userId, 'user', String(userId), `New user: ${name}`, req.ip);

  res.status(201).json({
    token,
    user: { id: userId, name, mobile, email, role: 'citizen', caseId, state: state || 'Maharashtra', district: district || '' },
    otpSent: true,
    message: 'OTP sent to registered mobile (check backend console).',
  });
});

// ── POST /api/auth/admin/register ──
router.post('/admin/register', async (req, res) => {
  const { officer_id, name, designation, department, password, email, phone, district, state } = req.body;
  const db = req.app.locals.db;

  if (!officer_id || !name || !password) {
    return res.status(400).json({ error: 'Officer ID, name and password are required.' });
  }

  // Bootstrap check: if ADMIN_BOOTSTRAP_TOKEN is set, require it in a header.
  const bootstrapToken = process.env.ADMIN_BOOTSTRAP_TOKEN;
  if (bootstrapToken) {
    const provided = req.headers['x-admin-bootstrap-token'];
    if (!provided || provided !== bootstrapToken) {
      await logAudit(db, 'ADMIN_REGISTER_FAILED_BOOTSTRAP', 'system', 0, 'admin', officer_id, 'Missing or invalid admin bootstrap token.', req.ip);
      return res.status(403).json({ error: 'Admin bootstrap token required.' });
    }
  }

  const existing = await db.get('SELECT id FROM admins WHERE officer_id = $1', [officer_id]);
  if (existing) return res.status(409).json({ error: 'Officer ID already registered.' });

  const result = await db.run(`
    INSERT INTO admins (officer_id, name, designation, department, password_hash, email, phone, district, state)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id
  `, [
    officer_id,
    name,
    designation || '',
    department || '',
    hashPassword(password),
    email || null,
    phone || null,
    district || '',
    state || 'Maharashtra'
  ]);

  const adminId = result.lastInsertRowid || result.rows?.[0]?.id;

  const token = generateToken({ id: adminId, role: 'admin', name, officerId: officer_id, district: district || '' });
  await logAudit(db, 'ADMIN_REGISTERED', 'system', adminId, 'admin', officer_id, `New admin: ${name}`, req.ip);

  res.status(201).json({
    token,
    user: { id: adminId, name, role: 'admin', officerId: officer_id, designation: designation || '', department: department || '', district: district || '' }
  });
});

// ── POST /api/auth/login ──
router.post('/login', validateLoginInput, async (req, res) => {
  const { id, password, role, isOtp } = req.body;
  const db = req.app.locals.db;

  // ---- Account lockout check ----
  const lockoutResult = await getLockout(db, role === 'admin' ? 'admin' : 'user', role === 'admin' ? id : (id || ''));
  if (lockoutResult) {
    await logAudit(db, 'USER_LOGIN_LOCKED', role === 'admin' ? 'admin' : 'system', 0, role === 'admin' ? 'admin' : 'user', id, `Account locked until ${lockoutResult}`, req.ip);
    return res.status(403).json({ error: `Account locked until ${new Date(lockoutResult).toLocaleString()}. Please try again later.` });
  }

  if (role === 'admin') {
    const admin = await db.get('SELECT * FROM admins WHERE officer_id = $1', [id]);
    if (!admin || !verifyPassword(password, admin.password_hash)) {
      await logAudit(db, 'ADMIN_LOGIN_FAILED', 'system', 0, 'admin', id, 'Invalid credentials', req.ip);
      await recordFailedLogin(db, 'admin', id);
      return res.status(401).json({ error: 'Invalid Officer ID or password.' });
    }
    await resetFailedLogins(db, 'admin', id);

    const token = generateToken({ id: admin.id, role: 'admin', name: admin.name, officerId: admin.officer_id, district: admin.district });
    await logAudit(db, 'ADMIN_LOGIN', 'admin', admin.id, 'admin', admin.officer_id, `Admin login: ${admin.name}`, req.ip);

    return res.json({
      token,
      user: { id: admin.id, name: admin.name, role: 'admin', officerId: admin.officer_id, designation: admin.designation, department: admin.department, district: admin.district }
    });
  }

  // User login – may be password or OTP mode
  const user = await db.get('SELECT * FROM users WHERE mobile = $1 OR email = $2', [id, id]);
  if (!user) {
    await logAudit(db, 'USER_LOGIN_FAILED', 'system', 0, 'user', id, 'User not found', req.ip);
    await recordFailedLogin(db, 'user', id);
    return res.status(401).json({ error: 'User not registered. Please register first or verify your mobile/email.' });
  }

  const isOtpMode = Boolean(isOtp || (password && /^\d{6}$/.test(password.trim())));

  if (isOtpMode) {
    const validOtp = await consumeUserOTP(db, user.mobile || user.email || '', password.trim());
    if (!validOtp) {
      await logAudit(db, 'USER_LOGIN_FAILED', 'system', user.id, 'user', id, 'Invalid OTP', req.ip);
      await recordFailedLogin(db, 'user', id);
      return res.status(401).json({ error: 'Invalid OTP. Please enter a valid 6‑digit OTP.' });
    }
    await resetFailedLogins(db, 'user', id);
    await logAudit(db, 'USER_LOGIN_OTP', 'user', user.id, 'user', String(user.id), `User OTP login: ${user.name}`, req.ip);
    const token = generateToken({ id: user.id, role: 'citizen', name: user.name, caseId: user.case_id, district: user.district, state: user.state });
    return res.json({
      token,
      user: { id: user.id, name: user.name, role: 'citizen', mobile: user.mobile, email: user.email, caseId: user.case_id, state: user.state, district: user.district, category: user.category, language: user.language }
    });
  }

  // Normal password login
  if (!verifyPassword(password, user.password_hash)) {
    await logAudit(db, 'USER_LOGIN_FAILED', 'system', user.id, 'user', id, 'Invalid password', req.ip);
    await recordFailedLogin(db, 'user', id);
    return res.status(401).json({ error: 'Invalid credentials. Check your mobile/email and password.' });
  }

  await resetFailedLogins(db, 'user', id);

  const token = generateToken({ id: user.id, role: 'citizen', name: user.name, caseId: user.case_id, district: user.district, state: user.state });

  await logAudit(db, 'USER_LOGIN', 'user', user.id, 'user', String(user.id), `User login: ${user.name}`, req.ip);

  res.json({
    token,
    user: { id: user.id, name: user.name, role: 'citizen', mobile: user.mobile, email: user.email, caseId: user.case_id, state: user.state, district: user.district, category: user.category, language: user.language }
  });
});

// ── GET /api/auth/me ──
router.get('/me', requireAuth, async (req, res) => {
  const db = req.app.locals.db;

  if (req.user.role === 'admin') {
    const admin = await db.get('SELECT * FROM admins WHERE id = $1', [req.user.id]);
    if (!admin) return res.status(404).json({ error: 'Admin not found.' });
    return res.json({
      id: admin.id, name: admin.name, role: 'admin', officerId: admin.officer_id,
      designation: admin.designation, department: admin.department, district: admin.district, email: admin.email
    });
  }

  const user = await db.get('SELECT * FROM users WHERE id = $1', [req.user.id]);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({
    id: user.id, name: user.name, role: 'citizen', mobile: user.mobile, email: user.email,
    caseId: user.case_id, state: user.state, district: user.district, category: user.category,
    language: user.language, dob: user.dob, createdAt: user.created_at
  });
});

// ── POST /api/auth/send-otp ──
router.post('/send-otp', async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) return res.status(400).json({ error: 'Mobile number required.' });

  const db = req.app.locals.db;
  const user = await db.get('SELECT id FROM users WHERE mobile = $1', [mobile]);
  if (!user) {
    await logAudit(db, 'SEND_OTP_ATTEMPT_UNREGISTERED', 'system', 0, 'user', mobile, 'OTP send attempt for unregistered mobile', req.ip);
    return res.json({ sent: true, message: 'If the mobile number is registered, an OTP has been sent.' });
  }

  const otp = generateOTP();
  await storeUserOTP(db, mobile, otp, 5); // 5‑minute expiry
  await logAudit(db, 'SEND_OTP_SUCCESS', 'user', user.id, 'user', mobile, 'OTP sent successfully', req.ip);
  res.json({ sent: true, message: 'If the mobile number is registered, an OTP has been sent.' });
});

// ── PUT /api/users/profile ──
router.put('/profile', requireAuth, async (req, res) => {
  const db = req.app.locals.db;
  const { name, language, address, district } = req.body;

  await db.query(`
    UPDATE users
    SET name = COALESCE($1, name),
        language = COALESCE($2, language),
        address = COALESCE($3, address),
        district = COALESCE($4, district),
        updated_at = NOW()
    WHERE id = $5
  `, [name || null, language || null, address || null, district || null, req.user.id]);

  await logAudit(db, 'PROFILE_UPDATED', 'user', req.user.id, 'user', String(req.user.id), 'Profile updated', req.ip);
  res.json({ ok: true, message: 'Profile updated.' });
});

export default router;