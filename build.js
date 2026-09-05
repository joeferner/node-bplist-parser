import { build } from 'esbuild';
import { copyFile, mkdir, readFile, writeFile } from 'fs/promises';

const entry = 'bplistParser.js';
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

// Ship the same declarations under both extensions so `import` and `require`
// consumers each resolve types under their own resolution mode.
const types = await readFile('bplistParser.d.ts', 'utf8');
await writeFile(`${outdir}/index.d.ts`, types);
await writeFile(`${outdir}/index.d.cts`, types);

console.log('built', outdir);
