// Hard rule 1: fail if any remote AI SDK / endpoint appears in the source.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
const BAD = [/openai/i, /anthropic/i, /generativelanguage\.googleapis/i, /@google\/generative-ai/i, /api\.cohere/i, /fonts\.googleapis/i];
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const hits = walk('src').filter(f => /\.(js|jsx|json)$/.test(f)).flatMap(f => { const t = readFileSync(f, 'utf8'); return BAD.filter(r => r.test(t)).map(r => `${f}: ${r}`); });
if (hits.length) { console.error('Remote AI / CDN references found:\n' + hits.join('\n')); process.exit(1); }
console.log('OK: no remote AI or CDN references.');
