import type { Finding, Severity } from '@kanca/engine/browser';

export interface Segment {
  text: string;
  ids: string[];
  severity: Severity | null;
}

const rank: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };

const ruleNeedles: Record<string, RegExp[]> = {
  H01: [/dmarc=fail/gi],
  H02: [/spf=(?:fail|softfail|permerror)/gi, /Received-SPF:\s*(?:fail|softfail|permerror)/gi],
  H03: [/dkim=(?:fail|permerror)/gi],
  H11: [],
  H13: [],
};

const tokenRe = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+|https?:\/\/[^\s<>"')]+|\b\d{1,3}(?:\.\d{1,3}){3}\b|\b(?:[a-z0-9-]+\.)+[a-z]{2,}\b/gi;
const quotedRe = /"([^"]{4,120})"/g;

function lowerSameLength(text: string) {
  let out = '';
  for (const ch of text) {
    const l = ch.toLocaleLowerCase('tr');
    out += l.length === ch.length ? l : ch;
  }
  return out;
}

function needlesFor(f: Finding): { plain: string[]; patterns: RegExp[] } {
  if (ruleNeedles[f.id]) return { plain: [], patterns: ruleNeedles[f.id] };
  const plain = new Set<string>();
  for (const e of f.evidence) {
    const trimmed = e.trim();
    if (trimmed.length >= 3 && trimmed.length <= 160 && !/^(Received|DKIM-Signature|Authentication-Results):/i.test(trimmed)) plain.add(trimmed);
    if (trimmed.length <= 120) for (const m of trimmed.matchAll(tokenRe)) plain.add(m[0]);
  }
  for (const m of f.detail.en.matchAll(quotedRe)) plain.add(m[1]);
  for (const m of f.detail.en.matchAll(tokenRe)) plain.add(m[0]);
  return { plain: [...plain].filter((n) => n.length >= 3), patterns: [] };
}

export function annotate(source: string, findings: Finding[]): { segments: Segment[]; marked: Set<string> } {
  const lower = lowerSameLength(source);
  const ranges: { start: number; end: number; id: string; severity: Severity }[] = [];
  const marked = new Set<string>();

  for (const f of findings) {
    const { plain, patterns } = needlesFor(f);
    for (const needle of plain) {
      const n = lowerSameLength(needle);
      let from = 0;
      let guard = 0;
      while (guard++ < 40) {
        const at = lower.indexOf(n, from);
        if (at < 0) break;
        ranges.push({ start: at, end: at + n.length, id: f.id, severity: f.severity });
        marked.add(f.id);
        from = at + n.length;
      }
    }
    for (const re of patterns) {
      for (const m of source.matchAll(new RegExp(re.source, re.flags))) {
        if (m.index === undefined) continue;
        ranges.push({ start: m.index, end: m.index + m[0].length, id: f.id, severity: f.severity });
        marked.add(f.id);
      }
    }
  }

  if (!ranges.length) return { segments: [{ text: source, ids: [], severity: null }], marked };

  const cuts = new Set<number>([0, source.length]);
  for (const r of ranges) {
    cuts.add(r.start);
    cuts.add(r.end);
  }
  const points = [...cuts].sort((a, b) => a - b);
  const segments: Segment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (a === b) continue;
    const covering = ranges.filter((r) => r.start <= a && r.end >= b);
    const ids = [...new Set(covering.map((r) => r.id))];
    let severity: Severity | null = null;
    for (const r of covering) if (!severity || rank[r.severity] > rank[severity]) severity = r.severity;
    const prev = segments[segments.length - 1];
    if (prev && prev.ids.join() === ids.join() && prev.severity === severity) prev.text += source.slice(a, b);
    else segments.push({ text: source.slice(a, b), ids, severity });
  }
  return { segments, marked };
}
