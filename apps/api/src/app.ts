import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { NodeDnsResolver, splitDomain, catalog, engineVersion } from '@kanca/engine/node';

const hostRe = /^(?=.{1,253}$)([a-z0-9¡-￿](?:[a-z0-9¡-￿-]{0,61}[a-z0-9¡-￿])?\.)+[a-z¡-￿]{2,63}$/i;

const buckets = new Map<string, { count: number; reset: number }>();
const limit = Number(process.env.RATE_LIMIT ?? 60);

function allow(key: string) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + 60_000 });
    return true;
  }
  b.count++;
  return b.count <= limit;
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
}, 60_000).unref?.();

export function createApp(resolver = new NodeDnsResolver()) {
  const app = new Hono();

  app.use('/api/*', cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? '*' }));

  app.get('/api/health', (c) => c.json({ ok: true, engine: engineVersion, rules: catalog.length }));

  app.get('/api/rules', (c) => c.json(catalog));

  app.get('/api/dns', async (c) => {
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || 'local';
    if (!allow(ip)) return c.json({ error: 'Çok fazla istek. Bir dakika sonra deneyin.' }, 429);

    const raw = (c.req.query('domain') ?? '').trim().toLowerCase();
    if (!raw || !hostRe.test(raw)) return c.json({ error: 'Geçersiz alan adı.' }, 400);

    const { registrable, isIp } = splitDomain(raw);
    if (isIp) return c.json({ error: 'IP adresi sorgulanamaz.' }, 400);

    const records = await resolver.lookup(registrable);
    c.header('Cache-Control', 'public, max-age=600');
    return c.json({ domain: registrable, ...records });
  });

  app.notFound((c) => c.json({ error: 'Bulunamadı.' }, 404));

  return app;
}
