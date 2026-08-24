import { Router } from 'express';
import { hashPassword, verifyPassword, generateToken, requireAuth, generateOTP } from '../auth.mjs';
import { logAudit } from '../db.mjs';

const router = Router();

// ── POST /api/auth/register ──
router.post('/register', (req, res) => {
  const { name, mobile, email, password, dob, state, district, category, language, address } = req.body;
  const db = req.app.locals.db;

  if (!name || !password) {
    return res.status(400).json({ error: 'Name and password are required.' });
  }
  if (!mobile && !email) {
    return res.status(400).json({ error: 'Mobile number or email is required.' });
  }

  // Check duplicate
  if (mobile) {
    const existing = db.prepare('SELECT id FROM users WHERE mobile = ?').get(mobile);
    if (existing) return res.status(409).json({ error: 'Mobile number already registered.' });
  }
  if (email) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'Email already registered.' });
  }

  const caseNum = Math.floor(10000 + Math.random() * 90000);
  const caseId = `RAH-${new Date().getFullYear()}-${caseNum}`;

  const result = db.prepare(`
    INSERT INTO users (name, mobile, email, password_hash, dob, state, district, category, language, address, case_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, mobile || null, email || null, hashPassword(password), dob || null, state || 'Maharashtra', district || '', category || '', language || 'English', address || '', caseId);

  const token = generateToken({ id: result.lastInsertRowid, role: 'citizen', name, caseId });

  logAudit(db, 'USER_REGISTERED', 'user', result.lastInsertRowid, 'user', String(result.lastInsertRowid), `New user: ${name}`, req.ip);

  res.status(201).json({
    token,
    user: { id: result.lastInsertRowid, name, mobile, email, role: 'citizen', caseId, state: state || 'Maharashtra', district: district || '' }
  });
});

// ── POST /api/auth/login ──
router.post('/login', (req, res) => {
  const { id, password, role } = req.body;
  const db = req.app.locals.db;

  if (!id || !password) {
    return res.status(400).json({ error: 'ID and password are required.' });
  }

  if (role === 'admin') {
    const admin = db.prepare('SELECT * FROM admins WHERE officer_id = ?').get(id);
    if (!admin || !verifyPassword(password, admin.password_hash)) {
      logAudit(db, 'ADMIN_LOGIN_FAILED', 'system', 0, 'admin', id, 'Invalid credentials', req.ip);
      return res.status(401).json({ error: 'Invalid Officer ID or password.' });
    }

    const token = generateToken({ id: admin.id, role: 'admin', name: admin.name, officerId: admin.officer_id, district: admin.district });
    logAudit(db, 'ADMIN_LOGIN', 'admin', admin.id, 'admin', admin.officer_id, `Admin login: ${admin.name}`, req.ip);

    return res.json({
      token,
      user: { id: admin.id, name: admin.name, role: 'admin', officerId: admin.officer_id, designation: admin.designation, department: admin.department, district: admin.district }
    });
  }

  // Citizen login — search by mobile or email
  const user = db.prepare('SELECT * FROM users WHERE mobile = ? OR email = ?').get(id, id);
  if (!user || !verifyPassword(password, user.password_hash)) {
    logAudit(db, 'USER_LOGIN_FAILED', 'system', 0, 'user', id, 'Invalid credentials', req.ip);
    return res.status(401).json({ error: 'Invalid credentials. Check your mobile/email and password.' });
  }

  const token = generateToken({ id: user.id, role: 'citizen', name: user.name, caseId: user.case_id, district: user.district, state: user.state });
  logAudit(db, 'USER_LOGIN', 'user', user.id, 'user', String(user.id), `User login: ${user.name}`, req.ip);

  res.json({
    token,
    user: { id: user.id, name: user.name, role: 'citizen', mobile: user.mobile, email: user.email, caseId: user.case_id, state: user.state, district: user.district, category: user.category, language: user.language }
  });
});

// ── GET /api/auth/me ──
router.get('/me', requireAuth, (req, res) => {
  const db = req.app.locals.db;

  if (req.user.role === 'admin') {
    const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.user.id);
    if (!admin) return res.status(404).json({ error: 'Admin not found.' });
    return res.json({
      id: admin.id, name: admin.name, role: 'admin', officerId: admin.officer_id,
      designation: admin.designation, department: admin.department, district: admin.district, email: admin.email
    });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({
    id: user.id, name: user.name, role: 'citizen', mobile: user.mobile, email: user.email,
    caseId: user.case_id, state: user.state, district: user.district, category: user.category,
    language: user.language, dob: user.dob, createdAt: user.created_at
  });
});

// ── POST /api/auth/send-otp ──
router.post('/send-otp', (req, res) => {
  const { mobile } = req.body;
  if (!mobile) return res.status(400).json({ error: 'Mobile number required.' });
  const otp = generateOTP(mobile);
  // In production: store OTP in DB/Redis with expiry and send via SMS gateway
  res.json({ sent: true, message: 'OTP sent to registered mobile (demo mode — check server console).' });
});

// ── PUT /api/users/profile ──
router.put('/profile', requireAuth, (req, res) => {
  const db = req.app.locals.db;
  const { name, language, address, district } = req.body;

  db.prepare(`UPDATE users SET name = COALESCE(?, name), language = COALESCE(?, language), address = COALESCE(?, address), district = COALESCE(?, district), updated_at = datetime('now') WHERE id = ?`)
    .run(name || null, language || null, address || null, district || null, req.user.id);

  logAudit(db, 'PROFILE_UPDATED', 'user', req.user.id, 'user', String(req.user.id), 'Profile updated', req.ip);
  res.json({ ok: true, message: 'Profile updated.' });
});

export default router;
