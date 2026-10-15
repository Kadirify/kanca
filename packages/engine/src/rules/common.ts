import type { AnalysisContext, Finding, Rule, RuleMeta, Text } from '../types.js';

export type Hitter = (detail: Text, evidence?: (string | undefined)[]) => void;

export function defineRule(meta: RuleMeta, run: (ctx: AnalysisContext, hit: Hitter) => void | Promise<void>): Rule {
  return {
    ...meta,
    async run(ctx) {
      const out: Finding[] = [];
      const hit: Hitter = (detail, evidence = []) => {
        const clean = evidence.filter((e): e is string => Boolean(e)).map((e) => e.slice(0, 400));
        out.push({ ...meta, detail, evidence: clean });
      };
      await run(ctx, hit);
      return out;
    },
  };
}
