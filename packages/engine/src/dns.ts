import { Resolver } from 'node:dns/promises';
import type { DnsRecords, DnsResolver } from './types.js';

const cache = new Map<string, { at: number; value: DnsRecords }>();
const ttlMs = 10 * 60 * 1000;

export class NodeDnsResolver implements DnsResolver {
  private resolver: Resolver;

  constructor(opts: { timeoutMs?: number; servers?: string[] } = {}) {
    this.resolver = new Resolver({ timeout: opts.timeoutMs ?? 2000, tries: 3 });
    if (opts.servers?.length) this.resolver.setServers(opts.servers);
  }

  async lookup(domain: string): Promise<DnsRecords> {
    const hit = cache.get(domain);
    if (hit && Date.now() - hit.at < ttlMs) return hit.value;
    const [mx, a, spf, dmarc] = await Promise.all([
      this.has(() => this.resolver.resolveMx(domain)),
      this.has(() => this.resolver.resolve4(domain)),
      this.txt(domain, (t) => /^v=spf1\b/i.test(t)),
      this.txt('_dmarc.' + domain, (t) => /^v=DMARC1\b/i.test(t)),
    ]);
    const value = { mx, a, spf, dmarc };
    cache.set(domain, { at: Date.now(), value });
    return value;
  }

  private async has(fn: () => Promise<unknown[]>): Promise<boolean | null> {
    try {
      const r = await fn();
      return r.length > 0;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'ENODATA' || code === 'ENOTFOUND') return false;
      return null;
    }
  }

  private async txt(name: string, pick: (t: string) => boolean): Promise<string | null> {
    try {
      const records = await this.resolver.resolveTxt(name);
      const joined = records.map((chunks) => chunks.join(''));
      return joined.find(pick) ?? '';
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'ENODATA' || code === 'ENOTFOUND') return '';
      return null;
    }
  }
}

export class StaticDnsResolver implements DnsResolver {
  constructor(private records: Record<string, Partial<DnsRecords>>) {}

  async lookup(domain: string): Promise<DnsRecords> {
    const r = this.records[domain] ?? {};
    return { mx: r.mx ?? false, a: r.a ?? false, spf: r.spf ?? '', dmarc: r.dmarc ?? '' };
  }
}
