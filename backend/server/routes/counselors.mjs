import { Router } from 'express';
import { requireAuth } from '../auth.mjs';

const router = Router();
const counselorIds = new Set([
	'CNS-MH-001',
	'CNS-MH-002',
	'CNS-MH-003',
	'CNS-MH-004',
	'CNS-MH-005',
	'CNS-DL-006',
	'CNS-MH-007',
	'CNS-MH-008'
]);

function requireUser(req, res, next) {
	if (req.user.role !== 'user') {
		return res.status(403).json({ error: 'User access required.' });
	}
	next();
}

router.get('/assigned', requireAuth, requireUser, async (req, res) => {
	try {
		const result = await req.app.locals.db.query(
			'SELECT counselor_id FROM users WHERE id = $1',
			[req.user.id]
		);
		const counselorId = result.rows[0]?.counselor_id;
		res.json({ counselor: counselorId ? { officer_id: counselorId } : null });
	} catch (err) {
		console.error('Assigned counselor lookup error:', err);
		res.status(500).json({ error: 'Unable to load assigned counselor.' });
	}
});

router.post('/assign', requireAuth, requireUser, async (req, res) => {
	const { counselorId } = req.body || {};
	if (!counselorIds.has(counselorId)) {
		return res.status(400).json({ error: 'A valid counselor must be selected.' });
	}

	try {
		const result = await req.app.locals.db.query(
			'UPDATE users SET counselor_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
			[counselorId, req.user.id]
		);
		if (!result.rows[0]) {
			return res.status(404).json({ error: 'User account not found.' });
		}
		res.json({ ok: true, counselor: { officer_id: counselorId } });
	} catch (err) {
		console.error('Counselor assignment error:', err);
		res.status(500).json({ error: 'Unable to assign counselor.' });
	}
});

export default router;
