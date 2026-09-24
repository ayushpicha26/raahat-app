/**
 * ml_engine/test_cases.js — Test all sample cases
 */

import { assess } from './index.js';

const cases = [
  {
    name: 'Priya (Critical)',
    text: 'Ab toh lagta hai jaan se maar denge... Gaon mein koi humari sunta nahi hai... Kuch bacha hi nahi, mar jaayein toh behtar hai... Bhrata ko mara, ghar pe pathar maare, boycot bhi kar diya, police ne fir bhi nahi li',
    duration: 120,
    district: 'sant kabir nagar',
    lang: 'Hindi'
  },
  {
    name: 'Ramesh (High - Social Boycott)',
    text: 'Sab samaj waale hamse baat nahi karte, dukan waale nahi bech rahe, bacche school nahi ja sakte. Koi hamari sunewala nahi hai.',
    duration: 60,
    district: 'nashik',
    lang: 'Hindi'
  },
  {
    name: 'Sunita (High - Land Displacement)',
    text: 'Jameen waale keh rahe hain ki hamaari jagah chhod do, nahi toh hmesa kar denge. Humaare paas jane ka koi rasta nahi hai.',
    duration: 45,
    district: 'shahdol',
    lang: 'Hindi'
  },
  {
    name: 'Kamla (Moderate)',
    text: 'Temple mein jaane diya nahi, pani ki container toda, jaati ke naam pe gaali di.',
    duration: 20,
    district: 'pune',
    lang: 'Marathi'
  },
  {
    name: 'Anonymous (Low)',
    text: 'I need some information about government schemes for my daughter education.',
    duration: 10,
    district: 'mumbai',
    lang: 'English'
  }
];

console.log('=== SVI RANGE TEST (0-100) ===\n');

for (const c of cases) {
  const result = assess(c.text, c.duration, c.district, c.lang);
  console.log(`[${c.name}]`);
  console.log(`  SVI: ${result.svi}/100`);
  console.log(`  Priority: ${result.priority}`);
  console.log(`  Safety Override: ${result.safetyOverride || 'None'}`);
  console.log('');
}
