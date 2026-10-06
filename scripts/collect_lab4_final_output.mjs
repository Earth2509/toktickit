// Preserve complete, attributed output without touching the public DB schema.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = '73faa8b0cee5adce1718cd97c5e32fc4bba9ec84';
const git = (...args) => {
  const r = spawnSync('git', ['-c', `safe.directory=${root.replaceAll('\\', '/')}`, ...args], { cwd: root, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr || 'Git inspection failed.');
  return r.stdout.trim();
};
const runtime = ['server', 'client', 'e2e', 'playwright.config.ts', 'package.json', 'package-lock.json'];
git('diff', '--exit-code', source, '--', ...runtime);
const environment = { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' };
// Default tests must not silently enable optional database suites.
for (const key of ['MIGRATION_TEST_DATABASE_URL', 'ADMIN_USERS_TEST_DATABASE_URL', 'LAB4_HISTORY_TEST_DATABASE_URL', 'LAB4_MIGRATION_TEST_DATABASE_URL', 'LAB4_PERFORMANCE_TEST_DATABASE_URL', 'LAB4_RECOVERY_SOURCE_URL', 'LAB4_RECOVERY_TARGET_URL']) delete environment[key];
const requireServer = createRequire(path.join(root, 'server/package.json'));
const config = requireServer('dotenv').parse(readFileSync(path.join(root, 'server/.env')));
const database = new URL(config.DATABASE_URL || '');
if (!['postgres:', 'postgresql:'].includes(database.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(database.hostname)) throw new Error('Only local PostgreSQL is accepted.');
const schemaUrl = (schema) => { const u = new URL(database); u.searchParams.set('schema', schema); return u.toString(); };
const jobs = [
  ['server', 'server', ['node_modules/vitest/vitest.mjs', 'run'], {}],
  ['client', 'client', ['node_modules/vitest/vitest.mjs', 'run'], {}],
  ['server-build', 'server', ['node_modules/typescript/bin/tsc'], {}],
  ['client-types', 'client', ['node_modules/typescript/bin/tsc'], {}],
  ['client-build', 'client', ['node_modules/vite/bin/vite.js', 'build'], {}],
  ['e2e', '.', ['node_modules/@playwright/test/cli.js', 'test'], { E2E_DATABASE_URL: schemaUrl('lab3_e2e'), E2E_API_PORT: '18301', E2E_CLIENT_PORT: '18173', E2E_REUSE_SERVERS: 'false', E2E_SKIP_PRISMA_GENERATE: 'true' }],
  ['history', 'server', ['scripts/run-lab4-history-test.mjs'], {}],
  ['migration', 'server', ['dist/scripts/run-lab4-migration-test.js'], {}],
  ['recovery', 'server', ['dist/scripts/run-lab4-recovery-test.js'], {}],
  ['performance', 'server', ['dist/scripts/run-lab4-dashboard-performance.js'], {}],
  ['lab3-migration', 'server', ['node_modules/vitest/vitest.mjs', 'run', 'tests/lab-03/migration.test.ts'], { MIGRATION_TEST_DATABASE_URL: schemaUrl('lab3_migration_test') }],
  ['admin-integration', 'server', ['node_modules/vitest/vitest.mjs', 'run', 'tests/lab-03/users-admin.integration.test.ts'], { ADMIN_USERS_TEST_DATABASE_URL: schemaUrl('lab3_admin_users_test') }],
];
const selected = process.argv[2] || 'plan';
const sandboxResolver = process.argv[3] === '--sandbox-resolver';
if (process.argv.length > 4 || (process.argv[3] && !sandboxResolver) || (sandboxResolver && selected !== 'admin-integration')) {
  throw new Error('The optional --sandbox-resolver is allowed only for admin-integration.');
}
if (sandboxResolver) {
  // Preserve the reviewed config file and all assertions. Override only Vite's
  // path-resolution strategy for this explicitly labelled sandbox invocation.
  const temporary = path.join(root, 'tmp/lab4-admin-sandbox-vitest.config.mjs');
  mkdirSync(path.dirname(temporary), { recursive: true });
  writeFileSync(temporary, 'export default ' + JSON.stringify({
    root: path.join(root, 'server'), resolve: { preserveSymlinks: true },
    test: { environment: 'node', include: ['tests/**/*.test.ts'] },
  }, null, 2) + ';\n', 'utf8');
  jobs.find(j => j[0] === selected)[2].push('--config', temporary);
}
if (selected === 'plan') {
  console.log(`Runtime/tests match reviewed main ${source}.`);
  console.log('Checks: ' + jobs.map(j => j[0]).join(', ') + ', all');
  console.log('Opt-in checks reset only guarded disposable test schemas. Stop the local API before E2E/DB checks to avoid Prisma DLL locks. No public-schema reset is performed.');
  process.exit(0);
}
if (selected !== 'all' && !jobs.some(j => j[0] === selected)) throw new Error('Unknown check. Run without arguments for the plan.');
const out = path.join(root, 'docs/lab-04/evidence/post-merge-73faa8b');
mkdirSync(out, { recursive: true });
const manifestPath = path.join(out, 'manifest.json');
let manifest;
try { manifest = JSON.parse(readFileSync(manifestPath, 'utf8')); } catch { manifest = { source, attribution: 'Executed by this collector; local documentation may differ, runtime/test tracked files match source.', checks: {} }; }
if (manifest.source !== source) throw new Error('Refusing to mix source versions.');
const redact = (text) => String(text).replace(/(postgres(?:ql)?:\/\/)[^\s/]+@/gi, '$1[credentials-redacted]@').replaceAll(database.password, database.password ? '[password-redacted]' : '');
for (const [name, dir, args, extra] of jobs.filter(j => selected === 'all' || j[0] === selected)) {
  const previous = manifest.checks[name];
  if (previous) {
    const archived = path.join(out, 'attempts');
    mkdirSync(archived, { recursive: true });
    const stem = `${name}-${previous.startedAt.replaceAll(':', '-')}`;
    try {
      const prior = readFileSync(path.join(out, `${name}-full.txt`), 'utf8');
      writeFileSync(path.join(archived, `${stem}.txt`), prior, 'utf8');
      writeFileSync(path.join(archived, `${stem}.json`), JSON.stringify(previous, null, 2) + '\n', 'utf8');
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const startedAt = new Date().toISOString();
  console.log(`Starting ${name}; reviewed main ${source.slice(0, 7)}.`);
  const cwd = path.resolve(root, dir);
  const r = spawnSync(process.execPath, args, { cwd, env: { ...environment, ...extra }, encoding: 'utf8', timeout: 600000, maxBuffer: 32 * 1024 * 1024 });
  const completedAt = new Date().toISOString();
  const header = `Reviewed runtime/test source: ${source}\nCheckout HEAD: ${git('rev-parse', 'HEAD')}\nBranch: ${git('branch', '--show-current')}\nWorking directory: ${dir}\nCommand: node ${args.join(' ')}\nNode: ${process.version}\nVITE_PRESERVE_SYMLINKS: ${environment.VITE_PRESERVE_SYMLINKS || '(unset)'}\nInvocation workaround: ${sandboxResolver ? 'Temporary equivalent Node test config with resolve.preserveSymlinks=true; reviewed server config and assertions unchanged.' : '(none)'}\nAttribution: collector invocation; not a fabricated terminal screenshot. Credentials, if present, are redacted.\nStarted UTC: ${startedAt}\n`;
  const log = header + '\nSTDOUT\n' + redact(r.stdout || '') + '\nSTDERR\n' + redact(r.stderr || '') + `\nCompleted UTC: ${completedAt}\nExit code: ${r.status}\n` + (r.error ? `Process error: ${redact(r.error.message)}\n` : '');
  writeFileSync(path.join(out, `${name}-full.txt`), log, 'utf8');
  manifest.checks[name] = { startedAt, completedAt, exitCode: r.status, file: `${name}-full.txt`, passed: r.status === 0 && !r.error };
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`${name}: exit ${r.status}; complete output preserved.`);
  if (r.status !== 0 || r.error) { console.error(redact(r.stderr || r.error?.message || r.stdout)); process.exit(1); }
}
