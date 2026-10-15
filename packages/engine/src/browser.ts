import { analyze as core, type AnalyzeOptions } from './analyze.js';
import { domExtractor } from './html-dom.js';
import type { Report } from './types.js';

export { domExtractor };
export * from './index.js';

export function analyze(source: string, opts: Omit<AnalyzeOptions, 'html'> = {}): Promise<Report> {
  return core(source, { html: domExtractor, ...opts });
}
