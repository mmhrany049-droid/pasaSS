import fs from 'fs'; import { rawTocToNodes, parseSSB } from './engine.js';
const pairs = [['toc_chem.txt', 'chemistry2_mobtakeran.ssb'], ['toc_phys.txt', 'physics2_kheilisabz.ssb'], ['toc_calc.txt', 'calculus1_olgoo.ssb']];
for (const [raw, seed] of pairs) {
  const r = rawTocToNodes(fs.readFileSync('../tests/raw_toc/' + raw, 'utf8'));
  const s = parseSSB(fs.readFileSync('../seed/' + seed, 'utf8')).nodes.filter(n => n.kind !== 'theory' && !(n.depth === 2 && /^(درس‌نامه|پرسش‌ها)$/.test(n.title)));
  const shape = a => a.map(n => n.depth + ':' + n.kind).join(',');
  console.log(raw, 'raw', r.length, 'seed', s.length, shape(r) === shape(s) ? 'SHAPE MATCH' : 'DIFF');
  if (shape(r) !== shape(s)) { for (let i = 0; i < Math.max(r.length, s.length); i++) if ((r[i]?.depth + r[i]?.kind) !== (s[i]?.depth + s[i]?.kind)) { console.log(i, r[i], s[i]?.depth, s[i]?.kind, s[i]?.title); break; } }
}
