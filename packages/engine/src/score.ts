import type { Finding, Layer, LayerResult, Verdict } from './types.js';
import { layerOrder } from './rules/index.js';

export const layerCaps: Record<Layer, number> = {
  headers: 45,
  dns: 25,
  domain: 35,
  links: 45,
  attachments: 40,
  content: 30,
};

export const thresholds = { medium: 25, high: 55 };

export function scoreLayers(findings: Finding[]): Record<Layer, LayerResult> {
  const out = {} as Record<Layer, LayerResult>;
  for (const layer of layerOrder) {
    const own = findings.filter((f) => f.layer === layer);
    const perRule = new Map<string, number>();
    for (const f of own) {
      const prev = perRule.get(f.id) ?? 0;
      perRule.set(f.id, prev === 0 ? f.weight : prev + Math.round(f.weight * 0.25));
    }
    const raw = [...perRule.values()].reduce((a, b) => a + b, 0);
    out[layer] = { score: Math.min(raw, layerCaps[layer]), findings: own };
  }
  return out;
}

export function totalScore(layers: Record<Layer, LayerResult>) {
  const sum = layerOrder.reduce((a, l) => a + layers[l].score, 0);
  const distinct = new Set(layerOrder.filter((l) => layers[l].score > 0));
  const bonus = distinct.size >= 3 ? 5 : 0;
  return Math.min(100, sum + bonus);
}

export function verdictOf(score: number): Verdict {
  if (score >= thresholds.high) return 'high';
  if (score >= thresholds.medium) return 'medium';
  return 'low';
}
