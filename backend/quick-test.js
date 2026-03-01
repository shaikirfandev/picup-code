const http = require('http');

const loginData = JSON.stringify({ email: 'admin@picup.app', password: 'admin123' });
const loginOpts = {
  hostname: 'localhost', port: 4500, path: '/api/auth/login', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
};

const req = http.request(loginOpts, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const data = JSON.parse(body);
    if (!data.data || !data.data.accessToken) {
      console.log('Login failed:', body.substring(0, 200));
      return;
    }
    console.log('Login OK');
    const token = data.data.accessToken;

    // Test access endpoint
    const opts = {
      hostname: 'localhost', port: 4500,
      path: '/api/creator-analytics/access',
      headers: { 'Authorization': 'Bearer ' + token }
    };
    http.get(opts, (r) => {
      let b = '';
      r.on('data', d => b += d);
      r.on('end', () => console.log('Access:', r.statusCode, b.substring(0, 200)));
    });

    // Test overview endpoint
    const opts2 = {
      hostname: 'localhost', port: 4500,
      path: '/api/creator-analytics/overview?period=30d',
      headers: { 'Authorization': 'Bearer ' + token }
    };
    http.get(opts2, (r) => {
      let b = '';
      r.on('data', d => b += d);
      r.on('end', () => console.log('Overview:', r.statusCode, b.substring(0, 400)));
    });
  });
});
req.write(loginData);
req.end();
