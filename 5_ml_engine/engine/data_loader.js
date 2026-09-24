/**
 * data_loader.js — Loads all patterns and geo data at startup
 *
 * Caches data for performance
 * Call reload() to refresh without restart
 */

import { loadAllPatterns } from './text_analyzer.js';
import { loadGeoData } from './geo_context.js';

let patternsCache = null;
let geoCache = null;

export function loadAll() {
  patternsCache = loadAllPatterns();
  geoCache = loadGeoData();
  console.log(`✅ ML Engine loaded: ${patternsCache.length} patterns, geo data for ${Object.keys(geoCache).length} states`);
  return { patterns: patternsCache, geo: geoCache };
}

export function getPatterns() {
  if (!patternsCache) loadAll();
  return patternsCache;
}

export function getGeoData() {
  if (!geoCache) loadAll();
  return geoCache;
}

export function reload() {
  patternsCache = null;
  geoCache = null;
  return loadAll();
}