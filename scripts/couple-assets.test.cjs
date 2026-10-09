const fs = require('node:fs'),
  assert = require('node:assert/strict'),
  path = require('node:path');
const root = path.resolve(__dirname, '..');
assert.deepEqual(
  fs.readFileSync(path.join(root, 'vendor/supabase.js')),
  fs.readFileSync(path.join(root, 'node_modules/@supabase/supabase-js/dist/umd/supabase.js')),
);
assert.deepEqual(
  fs.readFileSync(path.join(root, 'vendor/SUPABASE-LICENSE')),
  fs.readFileSync(path.join(root, 'node_modules/@supabase/supabase-js/LICENSE')),
);
const source = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
for (const file of [
  'couple.css',
  'couple-core.js',
  'couple-sync.js',
  'couple-auth.js',
  'couple-config.js',
  'couple-ui.js',
  'couple-invite.js',
  'vendor/supabase.js',
])
  assert.ok(source.includes("'./" + file + "'"));
for (const name of ['couple-core.js', 'couple-sync.js', 'couple-ui.js', 'couple-auth.js'])
  assert.ok(!fs.readFileSync(path.join(root, name), 'utf8').includes('flowfi.public.v27'));
console.log(
  '[OK] SDK/license match pinned official package; PWA assets included; Couple modules never access personal key',
);

const cfg = fs.readFileSync(path.join(root, 'couple-config.js'), 'utf8');
assert.ok(cfg.includes('sb_publishable_'));assert.ok(!cfg.includes('service_role'));assert.ok(!cfg.includes('localStorage'));
assert.ok(fs.readFileSync(path.join(root, 'couple-ui.js'),'utf8').includes('setupClient(window.LedgerCoupleDefaultConfig)'));
