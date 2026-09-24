/**
 * utils/audit_logger.js — Audit Trail for PostgreSQL
 */

export async function logAudit(db, action, actorType, actorId, targetType, targetId, details, ip) {
  try {
    return await db.query(
      `INSERT INTO audit_log (action, actor_type, actor_id, target_type, target_id, details, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        action,
        actorType,
        actorId || 0,
        targetType || '',
        String(targetId || ''),
        typeof details === 'object' ? JSON.stringify(details) : String(details || ''),
        ip || ''
      ]
    );
  } catch (err) {
    console.warn('Audit log failed:', err.message);
  }
}

export async function getAuditTrail(db, targetId) {
  return db.all(
    'SELECT * FROM audit_log WHERE target_id = $1 ORDER BY created_at DESC',
    [String(targetId)]
  );
}