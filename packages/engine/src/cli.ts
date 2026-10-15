import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { analyze, NodeDnsResolver } from './node.js';
import { layerNames, layerOrder } from './rules/index.js';
import type { Locale } from './types.js';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
if (!file) {
  console.error('usage: pnpm analyze <file.eml> [--dns] [--json] [--lang tr|en]');
  process.exit(1);
}

const langArg = args[args.indexOf('--lang') + 1];
const lang: Locale = args.includes('--lang') && langArg === 'tr' ? 'tr' : 'en';
const useDns = args.includes('--dns');

const source = await readFile(resolve(process.env.INIT_CWD ?? process.cwd(), file), 'utf8');
const report = await analyze(source, { network: useDns ? 'dns' : 'offline', dns: useDns ? new NodeDnsResolver() : undefined });

if (args.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

const verdicts = {
  en: { low: 'low risk', medium: 'suspicious', high: 'high risk' },
  tr: { low: 'düşük risk', medium: 'şüpheli', high: 'yüksek risk' },
};

console.log(`\n${report.summary.subject || '-'}`);
console.log(`${lang === 'tr' ? 'gönderen' : 'from'}: ${report.summary.from?.address ?? '-'}`);
console.log(`${lang === 'tr' ? 'puan' : 'score'}: ${report.score}/100  ${verdicts[lang][report.verdict]}\n`);
for (const layer of layerOrder) {
  const r = report.layers[layer];
  if (!r.findings.length) continue;
  console.log(`[${layerNames[layer][lang]}] ${r.score}`);
  for (const f of r.findings) console.log(`  ${f.id} ${f.severity.padEnd(8)} ${f.title[lang]} - ${f.detail[lang]}`);
}
if (report.skipped.length) {
  console.log('\n' + report.skipped.map((s) => `${layerNames[s.layer][lang]}: ${s.reason[lang]}`).join('\n'));
}
