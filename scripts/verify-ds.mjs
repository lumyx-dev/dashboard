#!/usr/bin/env node
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SCANNED = ['app', 'components', 'lib'].map((d) => join(ROOT, d));

// Seul fichier autorisé à porter une valeur de couleur littérale — c'est là que vivrait une
// valeur marketing-locale si jamais une apparaît. En pratique il n'y en a aucune.
const COLOR_EXEMPT = join(ROOT, 'app', 'globals.css');

const failures = [];
const fail = (rule, detail) => failures.push(`[${rule}] ${detail}`);

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const files = SCANNED.flatMap(walk);
const rel = (p) => p.slice(ROOT.length);

// 1. Aucune couleur en dur hors globals.css
// #000/transparent inside a maskImage gradient is a luminance mask (opaque vs. hidden), not a
// paint colour — exempt those lines rather than the whole file, so a real colour slipped in
// alongside one still gets caught.
const SAFE_HEX_REF =
  /(?:\bxlink:href|\bhref)\s*=\s*(?:"#[^"]*"|'#[^']*'|\{\s*['"]#[^'"}]*['"]\s*\})|\burl\(\s*#[^)]*\)/g;
const HEX = /#[0-9a-fA-F]{3,8}\b/;
const RGB = /\brgba?\(/;
const MASK_IMAGE_LINE = /\b(?:mask-image|maskImage|WebkitMaskImage|-webkit-mask-image)\s*[:=]/;
for (const f of files) {
  if (f === COLOR_EXEMPT) continue;
  readFileSync(f, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (MASK_IMAGE_LINE.test(line)) return;
      const scrubbed = line.replace(SAFE_HEX_REF, '');
      if (HEX.test(scrubbed) || RGB.test(scrubbed)) {
        fail('no-hardcoded-color', `${rel(f)}:${i + 1} — ${line.trim()}`);
      }
    });
}

// 2. Monospace par token uniquement (aligne sur @lumyx/ui 0.4). `sl-num`, `font-mono` et
// `var(--font-mono)` resolvent sur Geist Mono declare par le design system ; une pile litterale
// le contourne et reste interdite.
const LITERAL_MONO = /ui-monospace|'SF Mono'|"SF Mono"|\bMenlo\b|\bConsolas\b|\bmonospace\b/i;
const MONO_TOKEN = /\bfont-mono\b|var\(--font-mono\)/g;
for (const f of files) {
  readFileSync(f, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (LITERAL_MONO.test(line.replace(MONO_TOKEN, ''))) {
        fail('no-literal-monospace', `${rel(f)}:${i + 1} — ${line.trim()}`);
      }
    });
}

// 3. Pas de dangerouslySetInnerHTML
const DANGEROUS_HTML_USAGE = /dangerouslySetInnerHTML\s*[=:]/;
for (const f of files) {
  if (DANGEROUS_HTML_USAGE.test(readFileSync(f, 'utf8'))) {
    fail('no-dangerous-html', rel(f));
  }
}

// 4. Zéro *.module.css — globals.css est le seul fichier CSS d'apps/dashboard.
for (const f of files) {
  if (extname(f) === '.css' && f !== COLOR_EXEMPT) {
    fail('no-css-modules', rel(f));
  }
}

// 5-7. Les namespaces par defaut de Tailwind restent actifs : rien n'empeche a la compilation un
// `text-sm`, un `bg-white` ou un `duration-700`. Memes regles que @lumyx/ui (scripts/verify-ds.mjs).
const CODE_FILES = files.filter((f) => ['.ts', '.tsx', '.js'].includes(extname(f)));
function scanClasses(rule, pattern, accept = () => false) {
  for (const f of CODE_FILES) {
    readFileSync(f, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        for (const m of line.matchAll(pattern)) {
          if (!accept(m)) fail(rule, `${rel(f)}:${i + 1} — ${m[0]}`);
        }
      });
  }
}

// 5. Taille de texte sur l'echelle numerique (text-11 … text-44), jamais l'echelle Tailwind.
scanClasses('type-scale', /(?<![\w-])text-(?:xs|sm|base|lg|xl|[2-9]xl)(?![\w-])/g);
const SCALE = new Set(['11', '12', '13', '14', '16', '20', '24', '26', '30', '34', '36', '44']);
scanClasses('type-scale', /(?<![\w-])text-(\d+)(?![\w-])/g, (m) => SCALE.has(m[1]));

// 6. Couleur par token semantique : ni black/white, ni la palette par defaut de Tailwind.
const PALETTE =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const COLOR_UTILS =
  'bg|text|border(?:-[trblxyse])?|ring|ring-offset|outline|fill|stroke|from|via|to|divide|placeholder|caret|accent|decoration|shadow';
scanClasses(
  'no-raw-palette',
  new RegExp(`(?<![\\w-])(?:${COLOR_UTILS})-(?:black|white|(?:${PALETTE})-\\d{2,3})(?![\\w-])`, 'g'),
);

// 7. Durees de motion du design system : 120 / 180 / 260 micro-teintes et tailles,
// 300 lignes · 400 controles · 500 lift de carte · 600 entree d'ecran.
const DURATIONS = new Set(['0', '120', '180', '260', '300', '400', '500', '600']);
scanClasses('motion-duration', /(?<![\w-])duration-(\d+|\[[^\]]*\])/g, (m) => DURATIONS.has(m[1]));

if (failures.length) {
  console.error(`\n✗ ${failures.length} violation(s) des contraintes du design system\n`);
  failures.forEach((f) => console.error('  ' + f));
  process.exit(1);
}
console.log('✓ contraintes du design system respectees (apps/dashboard)');
