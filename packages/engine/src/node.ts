import { analyze as core, type AnalyzeOptions } from './analyze.js';
import { cheerioExtractor } from './html-cheerio.js';
import type { Report } from './types.js';

export { NodeDnsResolver } from './dns.js';
export { cheerioExtractor };
export * from './index.js';

export function analyze(source: string, opts: Omit<AnalyzeOptions, 'html'> = {}): Promise<Report> {
  return core(source, { html: cheerioExtractor, ...opts });
}
