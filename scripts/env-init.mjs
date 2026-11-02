// Copies every `.env.example` to `.env` (services) or `.env.local` (web) when missing.
// Never overwrites: your local secrets stay where they are. Works on Linux, macOS and Windows.
import { copyFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const targets = [
  ...readdirSync('services').map((name) => ({ dir: join('services', name), file: '.env' })),
  { dir: join('apps', 'web'), file: '.env.local' },
];

for (const { dir, file } of targets) {
  const example = join(dir, '.env.example');
  const target = join(dir, file);
  if (!existsSync(example) || existsSync(target)) continue;
  copyFileSync(example, target);
  process.stdout.write(`created ${target}\n`);
}
