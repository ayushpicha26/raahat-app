/**
 * test_ml.mjs — Test the ML engine with the Priya scenario
 *
 * Run: node ml_engine/test_ml.mjs
 */

import { assess } from './index.js';

const priyaText = 'Ab toh lagta hai jaan se maar denge... Gaon mein koi humari sunta nahi hai... Kuch bacha hi nahi, mar jaayein toh behtar hai... Bhrata ko mara, ghar pe pathar maare, boycot bhi kar diya, police ne fir bhi nahi li';

const result = assess(priyaText, 120, 'sant kabir nagar', 'Hindi');

console.log('=== PRIYA SCENARIO TEST ===');
console.log('SVI:', result.svi);
console.log('Priority:', result.priority);
console.log('Safety Override:', result.safetyOverride);
console.log('Problem Types:', JSON.stringify(result.problemTypes));
console.log('Summary:', result.summary);
console.log('Recommendations:', result.recommendations.length, 'items');
console.log('\n=== Full Result ===');
console.log(JSON.stringify(result, null, 2));