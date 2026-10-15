import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { analyze, StaticDnsResolver } from '../src/node.js';

const sample = (name: string) => readFile(new URL(`../../../samples/${name}`, import.meta.url), 'utf8');
const ids = (r: Awaited<ReturnType<typeof analyze>>) => r.findings.map((f) => f.id);

describe('banka oltalama örneği', () => {
  it('yüksek risk verir ve temel kuralları yakalar', async () => {
    const r = await analyze(await sample('banka-oltalama.eml'));
    expect(r.verdict).toBe('high');
    expect(r.score).toBeGreaterThanOrEqual(70);
    const found = ids(r);
    expect(found).toContain('H01');
    expect(found).toContain('H02');
    expect(found).toContain('H05');
    expect(found).toContain('H06');
    expect(found).toContain('H08');
    expect(found).toContain('N01');
    expect(found).toContain('L01');
    expect(found).toContain('L03');
    expect(found).toContain('C01');
    expect(found).toContain('C02');
    expect(found).toContain('C06');
    expect(found).toContain('C08');
    expect(found).toContain('H12');
  });

  it('özet alanlarını doldurur', async () => {
    const r = await analyze(await sample('banka-oltalama.eml'));
    expect(r.summary.from?.domain).toBe('garantibbva-guvenlik.com');
    expect(r.summary.replyTo?.domain).toBe('garanti-dogrulama.top');
    expect(r.summary.returnPath?.domain).toBe('mail-notify-8831.xyz');
    expect(r.auth).toMatchObject({ spf: 'fail', dkim: 'none', dmarc: 'fail' });
    expect(r.hops).toHaveLength(2);
    expect(r.hops[1].ip).toBe('192.168.1.77');
  });
});

describe('kargo eki örneği', () => {
  it('çift uzantılı arşivi ve IP bağlantısını yakalar', async () => {
    const r = await analyze(await sample('kargo-eki.eml'));
    const found = ids(r);
    expect(found).toContain('A02');
    expect(found).toContain('A04');
    expect(found).toContain('L04');
    expect(found).toContain('N01');
    expect(found).toContain('H02');
    expect(r.auth.spf).toBe('softfail');
    expect(r.verdict).toBe('high');
  });
});

describe('temiz bülten', () => {
  it('düşük risk verir', async () => {
    const r = await analyze(await sample('bulten-temiz.eml'));
    expect(r.verdict).toBe('low');
    expect(r.score).toBeLessThan(15);
    expect(ids(r)).not.toContain('H05');
    expect(ids(r)).not.toContain('L08');
  });

  it('dns modunda temiz kayıtlarla puan artmaz', async () => {
    const dns = new StaticDnsResolver({ 'ornekdergi.com': { mx: true, a: true, spf: 'v=spf1 include:_spf.ornekdergi.com -all', dmarc: 'v=DMARC1; p=reject' } });
    const r = await analyze(await sample('bulten-temiz.eml'), { network: 'dns', dns });
    expect(r.layers.dns.findings).toHaveLength(0);
    expect(r.skipped.find((s) => s.layer === 'dns')).toBeUndefined();
  });
});

describe('ingilizce hesap doğrulama', () => {
  it('görünen ad hilesi, kısaltıcı ve sahte Re: yakalanır', async () => {
    const r = await analyze(await sample('hesap-dogrulama-en.eml'));
    const found = ids(r);
    expect(found).toContain('H07');
    expect(found).toContain('H08');
    expect(found).toContain('L06');
    expect(found).toContain('C10');
    expect(found).toContain('C01');
    expect(found).toContain('C05');
    expect(r.verdict).not.toBe('low');
  });

  it('dns modunda eksik dmarc işaretlenir', async () => {
    const dns = new StaticDnsResolver({ 'secure-mailer-204.click': { mx: true, a: true, spf: 'v=spf1 +all', dmarc: '' } });
    const r = await analyze(await sample('hesap-dogrulama-en.eml'), { network: 'dns', dns });
    const found = ids(r);
    expect(found).toContain('D02');
    expect(found).toContain('D03');
  });
});

describe('başlıksız metin', () => {
  it('başlık yok uyarısı verir, yine de içerik ve bağlantıyı değerlendirir', async () => {
    const r = await analyze(await sample('sadece-metin.txt'));
    const found = ids(r);
    expect(r.summary.hasHeaders).toBe(false);
    expect(found).toContain('H13');
    expect(found).toContain('C01');
    expect(found).toContain('L02');
    expect(r.links[0].host).toBe('pttkargo-odeme.xyz');
  });
});

describe('puanlama', () => {
  it('aynı kural tekrarında tam ağırlık eklemez', async () => {
    const source = 'Subject: test\nFrom: a@ornek.com\n\nhttp://10.0.0.1/a http://10.0.0.2/b http://10.0.0.3/c';
    const r = await analyze(source);
    const l04 = r.findings.filter((f) => f.id === 'L04');
    expect(l04).toHaveLength(3);
    expect(r.layers.links.score).toBeLessThan(15 * 3);
  });

  it('katman tavanını aşmaz', async () => {
    const r = await analyze(await sample('banka-oltalama.eml'));
    expect(r.layers.headers.score).toBeLessThanOrEqual(45);
    expect(r.layers.links.score).toBeLessThanOrEqual(45);
    expect(r.score).toBeLessThanOrEqual(100);
  });
});

describe('kural sağlığı', () => {
  it('hiçbir kural hata vermez', async () => {
    for (const name of ['banka-oltalama.eml', 'kargo-eki.eml', 'bulten-temiz.eml', 'hesap-dogrulama-en.eml', 'sadece-metin.txt']) {
      const r = await analyze(await sample(name));
      const broken = r.findings.filter((f) => f.detail.tr.startsWith('Kural çalıştırılamadı'));
      expect(broken, name + ': ' + broken.map((b) => b.id + ' ' + b.detail.tr).join(' | ')).toHaveLength(0);
    }
  });
});

describe('paypal sample', () => {
  it('flags spoofed From, subdomain trick and pressure', async () => {
    const r = await analyze(await sample('paypal-en.eml'));
    const found = ids(r);
    expect(found).toContain('H01');
    expect(found).toContain('H05');
    expect(found).toContain('H06');
    expect(found).toContain('L03');
    expect(found).toContain('C01');
    expect(found).toContain('C02');
    expect(r.verdict).toBe('high');
  });

  it('every finding has both languages', async () => {
    const r = await analyze(await sample('paypal-en.eml'));
    for (const f of r.findings) {
      expect(f.title.en && f.title.tr && f.why.en && f.why.tr && f.detail.en && f.detail.tr).toBeTruthy();
    }
  });
});
