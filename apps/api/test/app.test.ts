import { describe, expect, it } from 'vitest';
import { StaticDnsResolver } from '@kanca/engine/node';
import { createApp } from '../src/app.js';

const app = createApp(new StaticDnsResolver({ 'ornek.com': { mx: true, a: true, spf: 'v=spf1 -all', dmarc: 'v=DMARC1; p=reject' } }));

describe('api', () => {
  it('sağlık ucu', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  it('dns sorgusu kayıtlı alan adına indirger', async () => {
    const res = await app.request('/api/dns?domain=mail.ornek.com');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.domain).toBe('ornek.com');
    expect(body.spf).toContain('spf1');
  });

  it('geçersiz girdiyi reddeder', async () => {
    expect((await app.request('/api/dns?domain=')).status).toBe(400);
    expect((await app.request('/api/dns?domain=1.2.3.4')).status).toBe(400);
    expect((await app.request('/api/dns?domain=..')).status).toBe(400);
  });
});
