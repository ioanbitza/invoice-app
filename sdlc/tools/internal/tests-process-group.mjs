#!/usr/bin/env node
// Runs `node --test <files>` in its own process group and kills the whole group when the time is up.
// Usage: node tests-process-group.mjs <timeoutMs> <cwd> <test files...>   -> exits with the test run's status, 124 on timeout.
// Why a separate process: the mutation run is synchronous (spawnSync), and spawnSync can only kill the one child it started.
// Node's test runner spawns a worker per file; a worker stuck in a mutated loop would survive its parent and spin forever.
import { spawn } from 'node:child_process';

const [timeoutMs, cwd, ...files] = process.argv.slice(2);
const env = { ...process.env };
delete env.NODE_TEST_CONTEXT;
const detached = process.platform !== 'win32';
// On Linux every test process gets an address-space limit (ulimit -v): a mutant that makes an assertion build an endless diff
// then dies in a second with a failed test instead of taking the whole machine down (seen on a GitHub runner: 16 GB in 8 s).
const ADDRESS_SPACE_KB = 3 * 1024 * 1024;
const command = process.platform === 'linux'
  ? ['/bin/sh', ['-c', 'ulimit -v "$1"; shift; exec "$@"', 'sh', String(ADDRESS_SPACE_KB), process.execPath, '--test', ...files]]
  : [process.execPath, ['--test', ...files]];
const child = spawn(command[0], command[1], { cwd, stdio: 'ignore', detached, env });

const killAll = () => {
  try {
    if (detached) process.kill(-child.pid, 'SIGKILL');
    else child.kill('SIGKILL');
  } catch {
    // already gone
  }
};
let timedOut = false;
const timer = setTimeout(() => {
  timedOut = true;
  killAll();
}, Number(timeoutMs));

child.on('error', () => {
  clearTimeout(timer);
  process.exit(125);
});
child.on('exit', (code, signal) => {
  clearTimeout(timer);
  process.exit(timedOut ? 124 : signal ? 1 : (code ?? 1));
});
