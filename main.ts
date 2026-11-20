// Leonida Platinum — make.fun entrypoint for gta6-trophy-guide-01 (Node 22, standard library only).
//
// The guide itself is the static web app in app/: index.html opens it in a desktop browser and it
// works with the network off, because everything it loads is a file beside it. This program hands
// the entry in: it copies app/ and screenshots/ from this repository into the output directory and
// writes dossier.json there with buildDossier from vendor/makefun-frontend.ts — the kit's library,
// vendored unchanged, because the scorer rebuilds the dossier with its own copy and compares the
// two byte for byte.
//
// Run it the way the grader does (MAKEFUN_OUTPUT_DIR stands in for /output outside the grader):
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// It runs twice at grading and both runs must write the same bytes, so nothing here depends on
// the clock, the environment beyond MAKEFUN_OUTPUT_DIR, or the network (there is none).

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps, mirrored so an over-limit entry fails here first with a clear cause:
// at most 4 screenshots of 256 KiB, at most 993 files and directories and 48 MiB under app/,
// and the dossier text capped at 160 KiB.
const DOSSIER_OPTIONS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

function handIn() {
  mkdirSync(outputDir, { recursive: true });
  cpSync(join(repoDir, 'app'), join(outputDir, 'app'), { recursive: true });
  mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
  if (existsSync(join(repoDir, 'screenshots'))) {
    cpSync(join(repoDir, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
  }
  const dossier = buildDossier(outputDir, DOSSIER_OPTIONS);
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
  console.log(`Leonida Platinum handed in: app/ + screenshots/ + dossier.json (${dossier.length} bytes) -> ${outputDir}`);
}

handIn();
