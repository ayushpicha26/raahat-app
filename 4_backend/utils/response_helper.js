/**
 * utils/response_helper.js — Standardized API Responses
 */

export function success(data, message = null) {
  return { ok: true, ...(message && { message }), data };
}

export function created(data) {
  return { ok: true, ...data };
}

export function error(message, status = 500) {
  return { ok: false, error: message, status };
}