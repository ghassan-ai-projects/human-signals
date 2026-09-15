/* Browser check for the v4 prototype. Run with: node scripts/v4-browser-check.mjs */
import { chromium } from 'playwright';
const BASE = process.env.V4_BASE || 'http://localhost:8765/v4/';
const OUT = process.env.V4_OUT || 'coverage/v4';
import { mkdirSync } from 'node:fs';
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
await p.goto(BASE, { waitUntil: 'networkidle' });
await p.waitForTimeout(1800);
await p.screenshot({ path: `${OUT}/00-home.png` });
console.log('ERRORS:', errs.length ? JSON.stringify(errs, null, 1) : 'none');
console.log('TITLE:', await p.title());
await b.close();
