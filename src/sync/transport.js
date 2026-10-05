// Sync transports (v6). Today: files (download/upload). After the site is hosted: HTTP to server/hub-server.mjs
// (or any backend implementing docs/handoff/api/hub_sync.openapi.yaml + the two endpoints below).
//   POST {base}/api/packs        body: .sspack JSON           → 201
//   GET  {base}/api/bulletin/latest                           → .ssbulletin JSON
// Same file formats either way, so switching from files to a server needs no data migration.
export function httpTransport(baseUrl, { token } = {}) {
  const base = String(baseUrl || '').replace(/\/+$/, '');
  const h = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const ok = async r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.status === 204 ? null : r.json(); };
  return {
    enabled: /^https?:\/\//.test(base),
    sendPack: pack => fetch(`${base}/api/packs`, { method: 'POST', headers: h, body: JSON.stringify(pack) }).then(ok),
    fetchBulletin: () => fetch(`${base}/api/bulletin/latest`, { headers: h, cache: 'no-store' }).then(ok),
    // hub (admin) side
    listPacks: () => fetch(`${base}/api/packs`, { headers: h }).then(ok),
    getPack: id => fetch(`${base}/api/packs/${encodeURIComponent(id)}`, { headers: h }).then(ok),
    publishBulletin: b => fetch(`${base}/api/bulletin`, { method: 'POST', headers: h, body: JSON.stringify(b) }).then(ok),
  };
}
