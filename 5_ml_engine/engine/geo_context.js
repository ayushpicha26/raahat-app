/**
 * geo_context.js — Applies district-level risk weighting
 *
 * Reads from 1_dataset/geo_context/india_districts.json
 * High-atrocity districts get higher multipliers
 * No external API calls
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GEO_DATA_PATH = path.join(__dirname, '..', '..', '1_dataset', 'geo_context', 'india_districts.json');

let geoCache = null;

export function loadGeoData() {
  if (geoCache) return geoCache;
  try {
    geoCache = JSON.parse(fs.readFileSync(GEO_DATA_PATH, 'utf8'));
  } catch (err) {
    console.warn('⚠️ Failed to load geo data, using default multiplier 1.0');
    geoCache = {};
  }
  return geoCache;
}

export function getDistrictMultiplier(districtName) {
  if (!districtName) return 1.0;
  const data = loadGeoData();
  const lower = districtName.toLowerCase().trim();

  for (const state in data) {
    const stateData = data[state];
    if (stateData.districts) {
      const found = stateData.districts.find(d => d.name === lower);
      if (found) return found.risk_multiplier || 1.0;
    }
  }
  return 1.0;
}

export function applyGeoContext(svi, district) {
  const multiplier = getDistrictMultiplier(district);
  return Math.max(0, Math.min(100, Math.round(svi * multiplier)));
}
