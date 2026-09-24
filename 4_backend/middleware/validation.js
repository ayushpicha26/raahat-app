/**
 * middleware/validation.js — Input Validation
 */

export function validateAssessmentInput(req, res, next) {
  const { text, duration, lang, district } = req.body;

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Text is required for assessment.' });
  }

  if (text.length > 5000) {
    return res.status(400).json({ error: 'Text exceeds maximum length (5000 characters).' });
  }

  next();
}

export function validateCaseInput(req, res, next) {
  const { transcript, svi, priority } = req.body;

  if (!transcript || svi === undefined || !priority) {
    return res.status(400).json({ error: 'Transcript, SVI, and priority are required.' });
  }

  if (typeof svi !== 'number' || svi < 0 || svi > 100) {
    return res.status(400).json({ error: 'SVI must be a number between 0-100.' });
  }

  if (!['Critical', 'High', 'Moderate', 'Low'].includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority value.' });
  }

  next();
}

/**
 * Validate registration payload.
 */
export function validateRegisterInput(req, res, next) {
  const { name, mobile, email, password, dob, state, district, category, language, address } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name is required.' });
  }
  if (name.trim().length > 100) {
    return res.status(400).json({ error: 'Name must be 100 characters or less.' });
  }

  if (!mobile && !email) {
    return res.status(400).json({ error: 'Mobile number or email is required.' });
  }
  if (mobile && !/^\+?\d[\d\s\-]{8,}$/.test(mobile.trim())) {
    return res.status(400).json({ error: 'Invalid mobile number format.' });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  if (password && typeof password === 'string') {
    // Minimum 8 chars, at least one uppercase, one lowercase, one digit, one special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(password.trim())) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.' });
    }
  } else {
    return res.status(400).json({ error: 'Password is required.' });
  }

  if (dob && typeof dob === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    return res.status(400).json({ error: 'Date of birth must be in YYYY-MM-DD format.' });
  }

  const validStates = ['Maharashtra', 'Uttar Pradesh', 'Madhya Pradesh', 'Rajasthan', 'Bihar', 'Gujarat', 'Karnataka', 'Tamil Nadu', 'Andhra Pradesh', 'West Bengal', 'Odisha', 'Punjab'];
  if (state && !validStates.includes(state)) {
    return res.status(400).json({ error: 'Invalid state.' });
  }

  const validLanguages = ['English', 'Hindi', 'Marathi', 'Bengali', 'Tamil', 'Telugu', 'Kannada', 'Gujarati', 'Punjabi', 'Malayalam', 'Odia'];
  if (language && !validLanguages.includes(language)) {
    return res.status(400).json({ error: 'Invalid language.' });
  }

  if (category && typeof category !== 'string') {
    return res.status(400).json({ error: 'Invalid category.' });
  }

  next();
}

/**
 * Validate admin registration payload.
 */
export function validateAdminRegisterInput(req, res, next) {
  const { officer_id, name, designation, department, password, email, phone, district, state } = req.body;

  if (!officer_id || typeof officer_id !== 'string' || !officer_id.trim()) {
    return res.status(400).json({ error: 'Officer ID is required.' });
  }
  if (officer_id.trim().length > 50) {
    return res.status(400).json({ error: 'Officer ID must be 50 characters or less.' });
  }

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name is required.' });
  }
  if (name.trim().length > 100) {
    return res.status(400).json({ error: 'Name must be 100 characters or less.' });
  }

  if (!password || typeof password !== 'string' || !password.trim()) {
    return res.status(400).json({ error: 'Password is required.' });
  }
  // Same complexity as user passwords
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  if (!passwordRegex.test(password.trim())) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.' });
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  if (phone && !/^\+?\d[\d\s\-]{8,}$/.test(phone.trim())) {
    return res.status(400).json({ error: 'Invalid phone number format.' });
  }

  const validStates = ['Maharashtra', 'Uttar Pradesh', 'Madhya Pradesh', 'Rajasthan', 'Bihar', 'Gujarat', 'Karnataka', 'Tamil Nadu', 'Andhra Pradesh', 'West Bengal', 'Odisha', 'Punjab'];
  if (state && !validStates.includes(state)) {
    return res.status(400).json({ error: 'Invalid state.' });
  }

  next();
}

/**
 * Validate login payload.
 */
export function validateLoginInput(req, res, next) {
  const { id, password, role, isOtp } = req.body;

  if (!id || typeof id !== 'string' || !id.trim()) {
    return res.status(400).json({ error: 'ID (mobile/email or officer ID) is required.' });
  }
  if (!password || typeof password !== 'string' || !password.trim()) {
    return res.status(400).json({ error: 'Password is required.' });
  }
  if (!role || (role !== 'user' && role !== 'admin' && role !== 'citizen')) {
    return res.status(400).json({ error: 'Role must be either "user" or "admin".' });
  }

  // If role is user and isOtp is true, password must be 6 digits
  if (role === 'user' && isOtp === true && !/^\d{6}$/.test(password.trim())) {
    return res.status(400).json({ error: 'OTP must be a 6-digit number.' });
  }

  next();
}

/**
 * Validate password strength (same as registration).
 */
export function validatePasswordStrength(password) {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  return passwordRegex.test(password);
}