#!/usr/bin/env node
// SS hub server — zero dependencies (Node ≥ 18). Serves the built site (dist/) and a tiny API so that, once the site
// is online, students can send their .sspack and fetch the latest .ssbulletin without passing files around.
//
//   PORT=8080 HUB_ADMIN_TOKEN=change-me node server/hub-server.mjs
//
// Public:  GET  /api/health · POST /api/packs · GET /api/bulletin/latest
// Admin (Authorization: Bearer $HUB_ADMIN_TOKEN):  GET /api/packs · GET /api/packs/:id · POST /api/bulletin
// Data lives in $DATA_DIR (default ./data): packs/<userId>.json (newest per person), bulletin/latest.json + archive.
import http from 'node:http';
import { createHash, timingSafeEqual } from 'node:crypto';
import { promises as fs, createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = +(process.env.PORT || 8080);
const DIST = path.resolve(process.env.DIST_DIR || path.join(ROOT, 'dist'));
const DATA = path.resolve(process.env.DATA_DIR || path.join(ROOT, 'data'));
const TOKEN = process.env.HUB_ADMIN_TOKEN || '';
const ORIGIN = process.env.CORS_ORIGIN || '';
const MAX_BODY = 8 * 1024 * 1024; // 8 MB per upload
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon' };

// same canonical form + SHA-256 as src/exchange.js
function canonical(x) {
  if (Array.isArray(x)) return '[' + x.map(canonical).join(',') + ']';
  if (x && typeof x === 'object') return '{' + Object.keys(x).filter(k => x[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + canonical(x[k])).join(',') + '}';
  return JSON.stringify(x ?? null);
}
const verify = o => { if (!o?.sum) return false; const { sum, ...rest } = o; return createHash('sha256').update(canonical(rest)).digest('hex') === sum; };
const safeId = s => String(s || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
const isAdmin = req => { const h = req.headers.authorization || ''; const t = h.startsWith('Bearer ') ? h.slice(7) : ''; if (!TOKEN || !t) return false; const a = Buffer.from(t), b = Buffer.from(TOKEN); return a.length === b.length && timingSafeEqual(a, b); };

// naive per-IP rate limit for uploads: 30 / 10 min
const hits = new Map();
const limited = ip => { const now = Date.now(); const arr = (hits.get(ip) || []).filter(t => now - t < 6e5); arr.push(now); hits.set(ip, arr); return arr.length > 30; };

function send(res, code, body, headers = {}) {
  const data = body == null ? '' : typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cors(), ...headers }); res.end(data);
}
const cors = () => ORIGIN ? { 'Access-Control-Allow-Origin': ORIGIN, 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' } : {};
function readBody(req) {
  return new Promise((ok, bad) => { let n = 0; const chunks = []; req.on('data', c => { n += c.length; if (n > MAX_BODY) { bad(new Error('too-large')); req.destroy(); } else chunks.push(c); }); req.on('end', () => ok(Buffer.concat(chunks).toString('utf8'))); req.on('error', bad); });
}
async function api(req, res, url) {
  const p = url.pathname;
  if (req.method === 'OPTIONS') return send(res, 204, null);
  if (p === '/api/health') return send(res, 200, { ok: true, time: new Date().toISOString() });
  if (p === '/api/packs' && req.method === 'POST') {
    if (limited(req.socket.remoteAddress)) return send(res, 429, { error: 'rate-limited' });
    let pack; try { pack = JSON.parse(await readBody(req)); } catch { return send(res, 400, { error: 'bad-json' }); }
    if (pack?.format !== 'sspack' || !verify(pack)) return send(res, 422, { error: 'invalid-pack' });
    const id = safeId(pack.user?.id); if (!id) return send(res, 422, { error: 'no-user' });
    const file = path.join(DATA, 'packs', id + '.json'); await fs.mkdir(path.dirname(file), { recursive: true });
    try { const old = JSON.parse(await fs.readFile(file, 'utf8')); if (old.createdAt >= pack.createdAt) return send(res, 409, { error: 'older-than-stored' }); } catch { /* first */ }
    await fs.writeFile(file, JSON.stringify(pack)); return send(res, 201, { id });
  }
  if (p === '/api/bulletin/latest' && req.method === 'GET') {
    try { return send(res, 200, await fs.readFile(path.join(DATA, 'bulletin', 'latest.json'), 'utf8')); } catch { return send(res, 404, { error: 'none' }); }
  }
  if (!isAdmin(req)) return send(res, 401, { error: 'admin-only' });
  if (p === '/api/packs' && req.method === 'GET') {
    const dir = path.join(DATA, 'packs'); let names = []; try { names = await fs.readdir(dir); } catch { /* none */ }
    const items = []; for (const n of names.filter(x => x.endsWith('.json'))) { try { const j = JSON.parse(await fs.readFile(path.join(dir, n), 'utf8')); items.push({ id: n.slice(0, -5), name: j.user?.name, createdAt: j.createdAt }); } catch { /* skip */ } }
    return send(res, 200, { items });
  }
  const m = p.match(/^\/api\/packs\/([a-zA-Z0-9_-]+)$/);
  if (m && req.method === 'GET') { try { return send(res, 200, await fs.readFile(path.join(DATA, 'packs', m[1] + '.json'), 'utf8')); } catch { return send(res, 404, { error: 'not-found' }); } }
  if (p === '/api/bulletin' && req.method === 'POST') {
    let b; try { b = JSON.parse(await readBody(req)); } catch { return send(res, 400, { error: 'bad-json' }); }
    if (b?.format !== 'ssbulletin' || !verify(b)) return send(res, 422, { error: 'invalid-bulletin' });
    const dir = path.join(DATA, 'bulletin'); await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, `${safeId(b.bulletinId)}.json`), JSON.stringify(b)); await fs.writeFile(path.join(dir, 'latest.json'), JSON.stringify(b));
    return send(res, 201, { id: b.bulletinId });
  }
  return send(res, 404, { error: 'not-found' });
}
function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname); if (rel.endsWith('/')) rel += 'index.html';
  let file = path.join(DIST, path.normalize(rel).replace(/^(\.\.[/\\])+/, ''));
  if (!file.startsWith(DIST)) return send(res, 403, { error: 'forbidden' });
  if (!existsSync(file) || statSync(file).isDirectory()) file = path.join(DIST, 'index.html'); // SPA fallback
  if (!existsSync(file)) return send(res, 404, 'build first: npm run build', { 'Content-Type': 'text/plain; charset=utf-8' });
  const ext = path.extname(file); const immutable = /\/assets\//.test(file);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self'" });
  createReadStream(file).pipe(res);
}
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  (url.pathname.startsWith('/api/') ? api(req, res, url) : Promise.resolve(serveStatic(req, res, url))).catch(e => send(res, e.message === 'too-large' ? 413 : 500, { error: e.message }));
}).listen(PORT, () => console.log(`SS hub server on :${PORT} · dist=${DIST} · data=${DATA}${TOKEN ? '' : ' · WARNING: HUB_ADMIN_TOKEN not set (admin API disabled)'}`));
