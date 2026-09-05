import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';

const entry = 'bplistParser.ts';
const outdir = 'dist';

await mkdir(outdir, { recursive: true });

const common = {
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  target: 'node20.19',
  packages: 'external',
  sourcemap: true,
};

await Promise.all([
  build({ ...common, format: 'esm', outfile: `${outdir}/index.mjs` }),
  build({ ...common, format: 'cjs', outfile: `${outdir}/index.cjs` }),
]);

// tsc emits the declaration for the entry file into dist/types; ship the same
// declarations under both extensions so `import` and `require` consumers each
// resolve types under their own resolution mode.
execFileSync('npx', ['tsc', '-p', 'tsconfig.build.json'], { stdio: 'inherit' });
const types = await readFile(`${outdir}/types/bplistParser.d.ts`, 'utf8');
await Promise.all([
  writeFile(`${outdir}/index.d.ts`, types),
  writeFile(`${outdir}/index.d.cts`, types),
]);
await rm(`${outdir}/types`, { recursive: true, force: true });

console.log('built', outdir);
