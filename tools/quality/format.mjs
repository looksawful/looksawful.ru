import { spawnSync } from 'node:child_process';

const argv = process.argv.slice(2);
const isCheck = argv[0] === '--check';
const paths = isCheck ? argv.slice(1) : argv;

if (paths.length === 0) {
  console.error(
    `Refusing to format the repository implicitly. Pass explicit files or directories, for example:\n` +
      `  npm run ${isCheck ? 'format:check' : 'format'} -- src/components/example.ts`,
  );
  process.exit(2);
}

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(
  npx,
  ['--yes', 'oxfmt@0.66.0', isCheck ? '--check' : '--write', ...paths],
  { stdio: 'inherit' },
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
