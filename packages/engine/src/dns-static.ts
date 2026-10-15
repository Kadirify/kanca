import type { DnsRecords, DnsResolver } from './types.js';

export class StaticDnsResolver implements DnsResolver {
  constructor(private records: Record<string, Partial<DnsRecords>>) {}

  async lookup(domain: string): Promise<DnsRecords> {
    const r = this.records[domain] ?? {};
    return { mx: r.mx ?? false, a: r.a ?? false, spf: r.spf ?? '', dmarc: r.dmarc ?? '' };
  }
}

export class HttpDnsResolver implements DnsResolver {
  constructor(private endpoint = '/api/dns', private timeoutMs = 9000) {}

  async lookup(domain: string): Promise<DnsRecords> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      const res = await fetch(`${this.endpoint}?domain=${encodeURIComponent(domain)}`, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`dns ${res.status}`);
      const data = (await res.json()) as DnsRecords;
      return { mx: data.mx ?? null, a: data.a ?? null, spf: data.spf ?? null, dmarc: data.dmarc ?? null };
    } finally {
      clearTimeout(timer);
    }
  }
}
