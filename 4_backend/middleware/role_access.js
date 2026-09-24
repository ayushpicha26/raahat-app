/**
 * middleware/role_access.js — Role-Based Data Access (per BRAIN.md)
 *
 * Each role gets only the data they need:
 * - Citizen: their own cases only
 * - Admin: district/state cases (filtered)
 * - Counsellor: assigned cases only (placeholder for future)
 */

export function filterCasesByRole(cases, user) {
  if (!user) return [];

  // Citizens see only their own cases
  if (user.role === 'citizen') {
    return cases.filter(c => c.user_id === user.id);
  }

  // Admins see cases in their district (if not super-admin)
  if (user.role === 'admin') {
    if (user.isSuperAdmin) return cases;
    return cases.filter(c => c.district === user.district);
  }

  return [];
}

export function canAccessCase(caseData, user) {
  if (!user) return false;

  if (user.role === 'citizen') {
    return caseData.user_id === user.id;
  }

  if (user.role === 'admin') {
    if (user.isSuperAdmin) return true;
    return caseData.district === user.district;
  }

  return false;
}

export function getAllowedFields(user, role) {
  const fieldMap = {
    citizen: [
      'case_id', 'transcript', 'svi', 'priority', 'priority_label',
      'problem_types', 'summary', 'consequences', 'status',
      'language_detected', 'created_at'
    ],
    admin: [
      'case_id', 'user_id', 'svi', 'priority', 'priority_label',
      'problem_types', 'summary', 'consequences', 'status',
      'assigned_officer', 'assigned_service', 'district', 'state',
      'language_detected', 'created_at'
    ]
  };
  return fieldMap[role] || [];
}