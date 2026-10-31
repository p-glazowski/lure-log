// Isolated smoke test: never loads .env or connects to the development/production DB.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
const requireServer = createRequire(new URL('../apps/server/package.json', import.meta.url));
const { MongoMemoryReplSet } = requireServer('mongodb-memory-server');
const mongoose = requireServer('mongoose');
const request = requireServer('supertest');
let mongo;
try {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  Object.assign(process.env, {
    NODE_ENV: 'production',
    CLIENT_ORIGIN: 'https://lurelog.example.test',
    MONGODB_URI: mongo.getUri(),
    JWT_SECRET: randomBytes(48).toString('hex'),
    STORAGE_PROVIDER: 'local',
    SMTP_HOST: 'smtp.example.test',
    SMTP_PORT: '587',
    SMTP_SECURE: 'false',
    SMTP_USER: 'smoke',
    SMTP_PASSWORD: 'smoke-only',
    SMTP_FROM: 'noreply@example.test',
  });
  const { app } = await import('../apps/server/dist/app.js');
  await mongoose.connect(process.env.MONGODB_URI);
  const { UserModel } = await import('../apps/server/dist/models/index.js');
  await UserModel.init();
  const get = (path) => request(app).get(path).set('X-Forwarded-Proto', 'https');
  const health = await get('/api/v1/health');
  assert.equal(health.status, 200);
  assert.equal(health.body.data.status, 'ok');
  for (const path of ['/', '/reset-password', '/catches/new']) {
    const page = await get(path);
    assert.equal(page.status, 200, path);
    assert.match(page.headers['content-type'], /text\/html/);
    assert.match(page.text, /id="root"/);
    assert.ok(page.headers['content-security-policy']);
    if (path === '/') {
      assert.equal(page.headers['x-robots-tag'], undefined);
      assert.match(page.text, /rel="canonical" href="https:\/\/lurelog\.example\.test\/"/);
      assert.match(page.text, /property="og:image"/);
      assert.equal((page.text.match(/<h1[ >]/g) ?? []).length, 1);
      assert.match(page.text, /Organize your lures, record your catches/);
      assert.match(page.text, /href="\/register"/);
      assert.match(page.text, /"@type":"WebSite","name":"LureLog"/);
    } else {
      assert.equal(page.headers['x-robots-tag'], 'noindex, follow');
      assert.match(page.text, /name="robots" content="noindex, follow"/);
      assert.doesNotMatch(page.text, /prerendered-home|class="landing"/);
    }
  }
  const robots = await get('/robots.txt');
  assert.equal(robots.status, 200);
  assert.match(robots.headers['content-type'], /text\/plain/);
  assert.match(robots.text, /Sitemap: https:\/\/lurelog\.example\.test\/sitemap.xml/);
  const sitemap = await get('/sitemap.xml');
  assert.equal(sitemap.status, 200);
  assert.match(sitemap.headers['content-type'], /application\/xml/);
  assert.match(sitemap.text, /<loc>https:\/\/lurelog\.example\.test\/<\/loc>/);
  assert.equal((await get('/not-a-page')).status, 404);
  assert.equal((await get('/index.html')).status, 301);
  const csrf = await get('/api/v1/csrf');
  const cookie = csrf.headers['set-cookie'][0];
  assert.match(cookie, /^__Host-lurelog-csrf=/);
  for (const attribute of ['Secure', 'HttpOnly', 'SameSite=Lax', 'Path=/'])
    assert.ok(cookie.includes(attribute));
  assert.ok(!cookie.includes('Domain='));
  const post = (origin) =>
    request(app)
      .post('/api/v1/auth/register')
      .set('X-Forwarded-Proto', 'https')
      .set('Origin', origin)
      .set('Cookie', cookie.split(';')[0])
      .set('X-CSRF-Token', csrf.body.data.token);
  assert.equal((await post('https://untrusted.example.test').send({})).status, 403);
  const registered = await post(process.env.CLIENT_ORIGIN).send({
    name: 'Smoke Angler',
    email: 'smoke@example.test',
    password: randomBytes(24).toString('hex'),
  });
  assert.equal(registered.status, 201);
  const sessionCookie = registered.headers['set-cookie'].find((value) =>
    value.startsWith('__Host-lurelog='),
  );
  assert.ok(sessionCookie?.includes('Secure'));
  assert.equal(
    (await get('/api/v1/auth/me').set('Cookie', sessionCookie.split(';')[0])).status,
    200,
  );
  const privateApi = await get('/api/v1/lures');
  assert.equal(privateApi.status, 401);
  assert.equal(privateApi.headers['x-robots-tag'], 'noindex, follow');
  assert.equal((await get('/api/not-real')).status, 404);
  await mongoose.disconnect();
  assert.equal((await get('/api/v1/health')).status, 503);
  console.log(
    'Production smoke passed: built SPA routes, SEO metadata, robots/sitemap, noindex, 404s, headers, secure cookies, registration/session, CSRF, private routes and database health. SMTP and cloud storage were not contacted.',
  );
} finally {
  await mongoose.disconnect();
  await mongo?.stop();
}
