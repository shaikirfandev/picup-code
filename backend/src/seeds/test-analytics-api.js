const http = require('http');
const fs = require('fs');
const results = [];

function log(msg) { results.push(msg); console.log(msg); }

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  // Login
  const postData = JSON.stringify({ email: 'admin@picup.app', password: 'admin123' });
  const loginRes = await makeRequest({
    hostname: 'localhost', port: 4500, path: '/api/auth/login',
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': postData.length },
  }, postData);

  const login = JSON.parse(loginRes.body);
  if (!login.success) { log('LOGIN FAILED: ' + loginRes.body.substring(0, 200)); process.exit(1); }
  const token = login.data.accessToken;
  log('Logged in as admin. Token: ' + token.substring(0, 20) + '...');

  // Test endpoints
  const endpoints = [
    ['/api/creator-analytics/access', 'Access'],
    ['/api/creator-analytics/overview?period=30d', 'Overview'],
    ['/api/creator-analytics/timeline?period=30d', 'Timeline'],
    ['/api/creator-analytics/followers?period=30d', 'Followers'],
    ['/api/creator-analytics/posts?period=30d', 'Posts Table'],
  ];

  for (const [path, label] of endpoints) {
    try {
      const res = await makeRequest({
        hostname: 'localhost', port: 4500, path,
        method: 'GET', headers: { 'Authorization': 'Bearer ' + token },
      });
      log(`\n[${label}] HTTP ${res.status}`);
      const d = JSON.parse(res.body);
      log(`  success: ${d.success}`);
      if (d.message) log(`  message: ${d.message}`);
      if (d.data) {
        const keys = Object.keys(d.data);
        log(`  data keys: ${keys.join(', ')}`);
        if (d.data.impressions) log(`  impressions: ${JSON.stringify(d.data.impressions)}`);
        if (d.data.hasAccess !== undefined) log(`  hasAccess: ${d.data.hasAccess}`);
        if (Array.isArray(d.data)) log(`  array length: ${d.data.length}`);
        if (d.data.data && Array.isArray(d.data.data)) log(`  data.data length: ${d.data.data.length}`);
      }
      if (!d.success) log(`  body: ${res.body.substring(0, 300)}`);
    } catch(e) {
      log(`[${label}] ERROR: ${e.message}`);
    }
  }

  fs.writeFileSync('/tmp/analytics-test-results.txt', results.join('\n'));
  log('\nDone. Results saved to /tmp/analytics-test-results.txt');
}

run().catch(e => { console.error(e); process.exit(1); });
