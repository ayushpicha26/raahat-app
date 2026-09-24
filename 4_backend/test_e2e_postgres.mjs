/**
 * 4_backend/test_e2e_postgres.mjs — Comprehensive End-to-End Test Suite for PostgreSQL
 */

import http from 'http';

const BASE_URL = 'http://127.0.0.1:3000';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const postData = body ? JSON.stringify(body) : null;

    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({ status: res.statusCode, data: json });
          } catch {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting RAAHAT PostgreSQL End-to-End Verification Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`   ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`   ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Health check
  console.log('1. Health Check');
  const health = await request('GET', '/api/health');
  assert(health.status === 200 && health.data.ok === true, 'Health check returns 200 OK');
  assert(health.data.databaseType === 'PostgreSQL', 'Database is identified as PostgreSQL');
  assert(Array.isArray(health.data.tables) && health.data.tables.length >= 10, 'All 10 tables are present');

  // 2. User Registration
  console.log('\n2. User Registration');
  const testMobile = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const regRes = await request('POST', '/api/auth/register', {
    name: 'Priya Kumari',
    mobile: testMobile,
    password: 'SecurePassword123!',
    dob: '2000-01-15',
    state: 'Maharashtra',
    district: 'raigad',
    category: 'SC',
    language: 'Hindi',
    address: 'Village Nandgaon, Taluka Panvel'
  });
  assert(regRes.status === 201 && regRes.data.token, 'User registered successfully and received token');
  assert(regRes.data.user.name === 'Priya Kumari', 'User profile returned with name Priya Kumari');
  const citizenToken = regRes.data.token;

  // 3. User Login (Password)
  console.log('\n3. User Login (Password)');
  const loginRes = await request('POST', '/api/auth/login', {
    id: testMobile,
    password: 'SecurePassword123!',
    role: 'user'
  });
  assert(loginRes.status === 200 && loginRes.data?.token, `User logged in successfully with password (${loginRes.data?.error || ''})`);
  assert(loginRes.data?.user?.mobile === testMobile, 'Login returned correct mobile');

  // 4. Admin Login (Migrated Admin ADM001)
  console.log('\n4. Admin Login (ADM001)');
  // In seed: password is same hash as Test Admin from SQLite
  // Let's register a new admin with bootstrap token to test admin register & login
  const bootstrapToken = 'beaed28fc7344bdcc9e0e6b0b0029516c7939cf92f4635b6';
  const newOfficerId = `OFF-${Math.floor(1000 + Math.random() * 9000)}`;
  const adminReg = await request('POST', '/api/auth/admin/register', {
    officer_id: newOfficerId,
    name: 'Officer Rajesh Patil',
    designation: 'Sub-Divisional Magistrate',
    department: 'Revenue & Social Welfare',
    password: 'AdminPassword123!',
    district: 'raigad',
    state: 'Maharashtra'
  }, { 'x-admin-bootstrap-token': bootstrapToken });
  assert(adminReg.status === 201 && adminReg.data.token, 'Admin registered successfully');

  const adminLogin = await request('POST', '/api/auth/login', {
    id: newOfficerId,
    password: 'AdminPassword123!',
    role: 'admin'
  });
  assert(adminLogin.status === 200 && adminLogin.data.token, 'Admin logged in successfully');
  const adminToken = adminLogin.data.token;

  // 5. Auth /me endpoint
  console.log('\n5. Current User Profile (/api/auth/me)');
  const meRes = await request('GET', '/api/auth/me', null, { Authorization: `Bearer ${citizenToken}` });
  assert(meRes.status === 200 && meRes.data.name === 'Priya Kumari', 'Citizen /me returns profile');

  const adminMeRes = await request('GET', '/api/auth/me', null, { Authorization: `Bearer ${adminToken}` });
  assert(adminMeRes.status === 200 && adminMeRes.data.officerId === newOfficerId, 'Admin /me returns officer profile');

  // 6. Update Profile
  console.log('\n6. Update Profile');
  const updateRes = await request('PUT', '/api/users/profile', {
    address: 'Updated Address, Raigad'
  }, { Authorization: `Bearer ${citizenToken}` });
  assert(updateRes.status === 200 && updateRes.data.ok === true, 'Profile updated successfully');

  // 7. Run Assessment (ML Engine -> PostgreSQL)
  console.log('\n7. Assessment Submission');
  const assessRes = await request('POST', '/api/assessment', {
    text: 'Humare gaon me hume dhmkaya ja raha hai, pani lene se roka gaya hai aur jaan se marne ki dhamki di gayi hai. Hum dar ke mare ghar se nahi nikal rahe.',
    duration: 90,
    lang: 'Hindi',
    district: 'raigad'
  }, { Authorization: `Bearer ${citizenToken}` });
  assert(assessRes.status === 201 && assessRes.data.caseId, 'Assessment created case in PostgreSQL');
  assert(assessRes.data.assessment && assessRes.data.assessment.svi > 0, 'SVI calculated properly by local ML engine');
  const assessedCaseId = assessRes.data.caseId;

  // 8. Create Case Directly with Factors and Recommendations
  console.log('\n8. Create Complete Case (/api/cases)');
  const createCaseRes = await request('POST', '/api/cases', {
    transcript: 'Hamare ghar par hamla hua aur dhamki di gayi.',
    svi: 92,
    priority: 'Critical',
    priorityLabel: 'CRITICAL PRIORITY',
    problemTypes: ['Threat / Intimidation', 'Social Boycott'],
    summary: 'Critical vulnerability with imminent safety risk.',
    consequences: 'Delayed support may escalate physical danger.',
    factors: [
      { label: 'Fear / Threat Level', value: 90, contrib: 'Critical', conf: 'High' },
      { label: 'Social Isolation', value: 85, contrib: 'High', conf: 'High' }
    ],
    indicators: [
      ['Perceived Threat Level', 'Critical'],
      ['Social Isolation', 'High']
    ],
    recommendations: [
      {
        title: 'Emergency Police Protection',
        priority: 'Immediate Attention',
        priorityColor: 'text-critical-700 bg-critical-50 border-critical-100',
        iconType: 'shield',
        desc: 'Immediate round-the-clock protection under PoA Act rules.',
        cta: 'Contact Protection Cell',
        urgent: true
      }
    ],
    languageDetected: 'Hindi',
    audioDurationSeconds: 45,
    aiMode: 'local'
  }, { Authorization: `Bearer ${citizenToken}` });
  assert(createCaseRes.status === 201 && createCaseRes.data.caseId, 'Case created with journey initialized in PostgreSQL');
  assert(createCaseRes.data.journey_steps > 0, 'Journey steps created for Critical case');
  const createdCaseId = createCaseRes.data.caseId;

  // 9. Case Listing
  console.log('\n9. Case Listing (/api/cases)');
  const listRes = await request('GET', '/api/cases?limit=20', null, { Authorization: `Bearer ${adminToken}` });
  assert(listRes.status === 200 && Array.isArray(listRes.data.cases), 'Admin receives list of cases');
  assert(listRes.data.total >= 2, `Total cases count matches (${listRes.data.total})`);

  // Filter by priority
  const criticalList = await request('GET', '/api/cases?priority=Critical', null, { Authorization: `Bearer ${adminToken}` });
  assert(criticalList.status === 200 && criticalList.data.cases.every(c => c.priority === 'Critical'), 'Filter by priority=Critical returns only Critical cases');

  // 10. Case Details
  console.log('\n10. Case Detail (/api/cases/:id)');
  const detailRes = await request('GET', `/api/cases/${createdCaseId}`, null, { Authorization: `Bearer ${adminToken}` });
  assert(detailRes.status === 200 && detailRes.data.case_id === createdCaseId, 'Fetched case details');
  assert(Array.isArray(detailRes.data.factors) && detailRes.data.factors.length === 2, 'Fetched assessment factors from PostgreSQL');
  assert(Array.isArray(detailRes.data.indicators) && detailRes.data.indicators.length === 2, 'Fetched assessment indicators from PostgreSQL');
  assert(Array.isArray(detailRes.data.recommendations) && detailRes.data.recommendations.length === 1, 'Fetched recommendations from PostgreSQL');
  assert(detailRes.data.recommendations[0].urgent === true, 'Boolean urgent flag properly converted from PostgreSQL');

  // 11. Case Journey Timeline
  console.log('\n11. Case Journey Timeline (/api/cases/:id/journey)');
  const journeyRes = await request('GET', `/api/cases/${createdCaseId}/journey`, null, { Authorization: `Bearer ${adminToken}` });
  assert(journeyRes.status === 200 && journeyRes.data.total_steps >= 5, 'Fetched case journey steps');
  assert(journeyRes.data.steps[0].status === 'completed', 'Step 1 (NLP Assessment) marked completed');
  assert(journeyRes.data.steps[1].status === 'in_progress', 'Step 2 (Counsellor Review) marked in_progress');
  const step2Id = journeyRes.data.steps[1].id;

  // 12. Complete Journey Step & Auto-Advance
  console.log('\n12. Complete Journey Step');
  const completeRes = await request('POST', `/api/cases/${createdCaseId}/journey/${step2Id}/complete`, {
    notes: 'Counselling initial contact established. Referred to DoSJE for relief.'
  }, { Authorization: `Bearer ${adminToken}` });
  assert(completeRes.status === 200 && completeRes.data.ok === true, 'Journey step 2 completed');
  assert(completeRes.data.next && completeRes.data.next.step_name === 'DoSJE Review', 'Workflow auto-advanced to DoSJE Review');

  // 13. Assign Officer to Journey Step
  console.log('\n13. Assign Officer to Journey Step');
  const step3Id = completeRes.data.next.id;
  const assignStepRes = await request('POST', `/api/cases/${createdCaseId}/journey/${step3Id}/assign`, {
    officerId: 101,
    officerName: 'Officer Deshmukh'
  }, { Authorization: `Bearer ${adminToken}` });
  assert(assignStepRes.status === 200 && assignStepRes.data.ok === true, 'Officer assigned to journey step in PostgreSQL');

  // 14. Work Queue by Role
  console.log('\n14. Work Queue by Role (/api/cases/admin/work-queue/:role)');
  const queueRes = await request('GET', '/api/cases/admin/work-queue/dosje', null, { Authorization: `Bearer ${adminToken}` });
  assert(queueRes.status === 200 && Array.isArray(queueRes.data.cases), 'Retrieved DoSJE work queue');
  assert(queueRes.data.cases.some(c => c.case_id === createdCaseId), 'Newly advanced case appears in DoSJE work queue');

  // 15. Update Status & Assign Officer directly on case
  console.log('\n15. Update Case Status & Officer');
  const statusRes = await request('PUT', `/api/cases/${createdCaseId}/status`, { status: 'Under Review' }, { Authorization: `Bearer ${adminToken}` });
  assert(statusRes.status === 200 && statusRes.data.ok === true, 'Case status updated in PostgreSQL');

  const assignRes = await request('PUT', `/api/cases/${createdCaseId}/assign`, {
    officer: 'Dr. Meera Joshi',
    service: 'Counselling'
  }, { Authorization: `Bearer ${adminToken}` });
  assert(assignRes.status === 200 && assignRes.data.ok === true, 'Case assigned officer updated in PostgreSQL');

  // 16. Admin Dashboard Stats
  console.log('\n16. Admin Stats (/api/cases/admin/stats)');
  const statsRes = await request('GET', '/api/cases/admin/stats', null, { Authorization: `Bearer ${adminToken}` });
  assert(statsRes.status === 200 && statsRes.data.total >= 2, 'Admin stats calculated total cases');
  assert(statsRes.data.avgSvi > 0, `Average SVI calculated: ${statsRes.data.avgSvi}`);
  assert(Array.isArray(statsRes.data.districtStats), 'District stats aggregated');
  assert(Array.isArray(statsRes.data.priorityDist), 'Priority distribution generated');
  assert(Array.isArray(statsRes.data.recentCases), 'Recent cases loaded with user holders');

  // 17. Assessment Stats
  console.log('\n17. Assessment Stats (/api/assessment/stats)');
  const assessStats = await request('GET', '/api/assessment/stats', null, { Authorization: `Bearer ${adminToken}` });
  assert(assessStats.status === 200 && assessStats.data.ok === true, 'Assessment stats returned successfully');

  console.log('\n=======================================');
  console.log(`🏁 Test Summary: ${passed} passed, ${failed} failed`);
  console.log('=======================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Unhandled test runner error:', err);
  process.exit(1);
});
