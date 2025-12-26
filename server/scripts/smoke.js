/* eslint-disable no-console */
const http = require('http');

function request({ path, method = 'GET', body, token }) {
  const data = body ? JSON.stringify(body) : null;
  const opts = {
    hostname: 'localhost',
    port: 4000,
    path,
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  if (token) opts.headers.Authorization = `Bearer ${token}`;
  if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);

  return new Promise((resolve, reject) => {
    const req = http.request(opts, (res) => {
      let raw = '';
      res.on('data', (chunk) => {
        raw += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = raw ? JSON.parse(raw) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  try {
    const login = await request({
      path: '/api/v1/auth/login',
      method: 'POST',
      body: { email: 'admin@pulsegen.io', password: 'admin123', tenantId: 'pulsegen' },
    });
    console.log('Login status', login.status);
    if (!login.body?.token) throw new Error('No token');

    const videos = await request({ path: '/api/v1/videos', token: login.body.token });
    console.log('Videos status', videos.status, 'count', Array.isArray(videos.body) ? videos.body.length : 0);

    const first = Array.isArray(videos.body) && videos.body[0];
    if (first) {
      const comments = await request({ path: `/api/v1/comments/${first._id}`, token: login.body.token });
      console.log('Comments status', comments.status, 'count', Array.isArray(comments.body) ? comments.body.length : 0);
    }
  } catch (err) {
    console.error('Smoke failed', err.message);
    process.exit(1);
  }
})();
