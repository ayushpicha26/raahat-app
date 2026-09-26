import { Router } from 'express';
import { hashPassword, verifyPassword, generateToken, requireAuth, generateOTP } from '../auth.mjs';
import { logAudit } from '../db.mjs';

const router = Router();
const COUNSELLOR_DEMO_ACCOUNTS = {
  'CNS-MH-001': { name: 'Dr. Meera Joshi', designation: 'Counsellor — Trauma & Crisis', district: 'Nagpur', email: 'meera.joshi@raahat.gov.in' },
  'CNS-MH-002': { name: 'Dr. Anjali Deshmukh', designation: 'Counsellor — Women & Family Support', district: 'Pune', email: 'anjali.deshmukh@raahat.gov.in' },
  'CNS-MH-003': { name: 'Mr. Vikram Kulkarni', designation: 'Counsellor — Youth & Psychosocial Support', district: 'Nashik', email: 'vikram.kulkarni@raahat.gov.in' },
};

// ── POST /api/auth/register ──
router.post('/register', async (req, res) => {
  const { name, mobile, email, password, dob, state, district, category, language, address, alternatePhone } = req.body;
  const db = req.app.locals.db;

  if (!name || !password) {
    return res.status(400).json({ error: 'Name and password are required.' });
  }
  if (!mobile && !email) {
    return res.status(400).json({ error: 'Mobile number or email is required.' });
  }

  try {
    // Check duplicate
    if (mobile) {
      const existing = await db.query('SELECT id FROM users WHERE mobile = $1', [mobile]);
      if (existing.rows.length > 0) return res.status(409).json({ error: 'Mobile number already registered.' });
    }
    if (email) {
      const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already registered.' });
    }

    const caseNum = Math.floor(10000 + Math.random() * 90000);
    const caseId = `RAH-${new Date().getFullYear()}-${caseNum}`;

    const result = await db.query(
      `INSERT INTO users (name, mobile, email, password_hash, dob, state, district, category, language, address, case_id, alternate_phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [name, mobile || null, email || null, hashPassword(password), dob || null, state || 'Maharashtra', district || '', category || '', language || 'English', address || '', caseId, alternatePhone || null]
    );

    const newUserId = result.rows[0].id;
    const token = generateToken({ id: newUserId, role: 'citizen', name, caseId });

    await logAudit(db, 'USER_REGISTERED', 'user', newUserId, 'user', String(newUserId), `New user: ${name}`, req.ip);

    res.status(201).json({
      token,
      user: { id: newUserId, name, mobile, email, alternatePhone: alternatePhone || null, role: 'citizen', caseId, state: state || 'Maharashtra', district: district || '' }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// ── POST /api/auth/login ──
router.post('/login', async (req, res) => {
  const { id, password, role } = req.body;
  const db = req.app.locals.db;

  if (!id || !password) {
    return res.status(400).json({ error: 'ID and password are required.' });
  }

  try {
    if (role === 'admin' || id.startsWith('ADM-') || id.startsWith('CNS-')) {
      let adminRes = await db.query('SELECT * FROM admins WHERE officer_id = $1', [id]);
      let admin = adminRes.rows[0];

      // Demo safety net: supports existing databases that were created before counsellor accounts were added.
      const counsellor = COUNSELLOR_DEMO_ACCOUNTS[id];
      if (!admin && counsellor && password === 'counsellor123') {
        await db.query(
          `INSERT INTO admins (officer_id, name, designation, department, password_hash, email, district, state)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [id, counsellor.name, counsellor.designation, 'Counselling Services', hashPassword(password), counsellor.email, counsellor.district, 'Maharashtra']
        );
        adminRes = await db.query('SELECT * FROM admins WHERE officer_id = $1', [id]);
        admin = adminRes.rows[0];
      }

      if (!admin || !verifyPassword(password, admin.password_hash)) {
        await logAudit(db, 'ADMIN_LOGIN_FAILED', 'system', 0, 'admin', id, 'Invalid credentials', req.ip);
        return res.status(401).json({ error: 'Invalid Officer ID or password.' });
      }

      const isCounsellor = admin.officer_id.startsWith('CNS-');
      const accountRole = isCounsellor ? 'counsellor' : 'admin';
      const token = generateToken({ id: admin.id, role: accountRole, name: admin.name, officerId: admin.officer_id, district: admin.district });
      await logAudit(db, isCounsellor ? 'COUNSELLOR_LOGIN' : 'ADMIN_LOGIN', 'admin', admin.id, 'admin', admin.officer_id, `${isCounsellor ? 'Counsellor' : 'Admin'} login: ${admin.name}`, req.ip);

      return res.json({
        token,
        user: { id: admin.id, name: admin.name, role: accountRole, officerId: admin.officer_id, designation: admin.designation, department: admin.department, district: admin.district }
      });
    }

    // Citizen login — search by mobile or email
    const userRes = await db.query('SELECT * FROM users WHERE mobile = $1 OR email = $2', [id, id]);
    const user = userRes.rows[0];

    if (!user || !verifyPassword(password, user.password_hash)) {
      await logAudit(db, 'USER_LOGIN_FAILED', 'system', 0, 'user', id, 'Invalid credentials', req.ip);
      return res.status(401).json({ error: 'Invalid credentials. Check your mobile/email and password.' });
    }

    const token = generateToken({ id: user.id, role: 'citizen', name: user.name, caseId: user.case_id, district: user.district, state: user.state });
    await logAudit(db, 'USER_LOGIN', 'user', user.id, 'user', String(user.id), `User login: ${user.name}`, req.ip);

    res.json({
      token,
      user: { id: user.id, name: user.name, role: 'citizen', mobile: user.mobile, email: user.email, alternatePhone: user.alternate_phone, caseId: user.case_id, state: user.state, district: user.district, category: user.category, language: user.language }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// ── GET /api/auth/me ──
router.get('/me', requireAuth, async (req, res) => {
  const db = req.app.locals.db;

  try {
    if (req.user.role === 'admin') {
      const adminRes = await db.query('SELECT * FROM admins WHERE id = $1', [req.user.id]);
      const admin = adminRes.rows[0];
      if (!admin) return res.status(404).json({ error: 'Admin not found.' });
      return res.json({
        id: admin.id, name: admin.name, role: 'admin', officerId: admin.officer_id,
        designation: admin.designation, department: admin.department, district: admin.district, email: admin.email
      });
    }

    const userRes = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({
      id: user.id, name: user.name, role: 'citizen', mobile: user.mobile, email: user.email,
      alternatePhone: user.alternate_phone,
      caseId: user.case_id, state: user.state, district: user.district, category: user.category,
      language: user.language, dob: user.dob, createdAt: user.created_at
    });
  } catch (err) {
    console.error('Auth/me error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// ── POST /api/auth/send-otp ──
router.post('/send-otp', (req, res) => {
  const { mobile } = req.body;
  if (!mobile) return res.status(400).json({ error: 'Mobile number required.' });
  const otp = generateOTP(mobile);
  res.json({ sent: true, message: 'OTP sent to registered mobile (demo mode — check server console).' });
});

// ── PUT /api/users/profile ──
router.put('/profile', requireAuth, async (req, res) => {
  const db = req.app.locals.db;
  const { name, language, address, district, alternatePhone } = req.body;

  try {
    await db.query(
      `UPDATE users SET 
        name = COALESCE($1, name), 
        language = COALESCE($2, language), 
        address = COALESCE($3, address), 
        district = COALESCE($4, district), 
        alternate_phone = COALESCE($5, alternate_phone),
        updated_at = CURRENT_TIMESTAMP 
        WHERE id = $6`,
      [name || null, language || null, address || null, district || null, alternatePhone || null, req.user.id]
    );

    await logAudit(db, 'PROFILE_UPDATED', 'user', req.user.id, 'user', String(req.user.id), 'Profile updated', req.ip);
    res.json({ ok: true, message: 'Profile updated.' });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

export default router;
