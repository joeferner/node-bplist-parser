// Verifies the published dual build: the parser's named exports must be
// reachable from both `require()` and `import`. Run with `npm run smoke`
// after a build.
const assert = require('node:assert');
const path = require('node:path');

const sample = path.join(__dirname, 'test', 'sample1.bplist');
const names = ['parseFile', 'parseFileSync', 'parseBuffer'];

const cjs = require('./dist/index.cjs');
for (const name of names) {
  assert.strictEqual(typeof cjs[name], 'function', `require().${name} should be a function`);
}
assert.strictEqual(typeof cjs.UID, 'function', 'require().UID should be a constructor');

const [fromCjs] = cjs.parseFileSync(sample);
assert.strictEqual(fromCjs.CFBundleIdentifier, 'com.apple.dictionary.MySample');

import('./dist/index.mjs').then((esm) => {
  for (const name of names) {
    assert.strictEqual(typeof esm[name], 'function', `import { ${name} } should be a function`);
  }
  assert.strictEqual(typeof esm.UID, 'function', 'import { UID } should be a constructor');

  const [fromEsm] = esm.parseFileSync(sample);
  assert.deepStrictEqual(fromEsm, fromCjs, 'both builds should parse identically');

  console.log('smoke: cjs + esm builds OK');
});
