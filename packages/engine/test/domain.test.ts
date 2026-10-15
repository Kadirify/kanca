import { describe, expect, it } from 'vitest';
import { levenshtein, matchBrand, normalizeLabel, splitDomain } from '../src/domain.js';
import { looksLikeRawMessage } from '../src/parse.js';

describe('alan adı araçları', () => {
  it('resmi alan adlarını tanır', () => {
    expect(matchBrand('ziraatbank.com.tr')?.kind).toBe('official');
    expect(matchBrand('mail.garantibbva.com.tr')?.kind).toBe('official');
    expect(matchBrand('accounts.google.com')?.kind).toBe('official');
  });

  it('benzer alan adlarını yakalar', () => {
    expect(matchBrand('z1raatbank.com')?.kind).toBe('lookalike');
    expect(matchBrand('garantl.com')?.kind).toBe('lookalike');
    expect(matchBrand('garanti-guvenlik.com')?.kind).toBe('contains');
    expect(matchBrand('trendyol.xyz')?.kind).toBe('lookalike');
    expect(matchBrand('rnicrosoft.com')?.kind).toBe('lookalike');
    expect(matchBrand('paypa1.com')?.kind).toBe('lookalike');
    expect(matchBrand('wellsfarg0-secure.com')?.kind).toBe('contains');
    expect(matchBrand('coinbase.com.verify-wallet.io')?.kind).not.toBe('official');
  });

  it('ilgisiz alan adlarına dokunmaz', () => {
    expect(matchBrand('ornekdergi.com')).toBeNull();
    expect(matchBrand('github.com')?.kind).toBe('official');
    expect(matchBrand('gitlab.com')).toBeNull();
    expect(matchBrand('kadir.dev')).toBeNull();
  });

  it('kayıtlı alan adını ayırır', () => {
    expect(splitDomain('hesap.garanti.com.tr.dogrula.xyz').registrable).toBe('dogrula.xyz');
    expect(splitDomain('mail.isbank.com.tr').registrable).toBe('isbank.com.tr');
    expect(splitDomain('185.23.4.5').isIp).toBe(true);
  });

  it('homoglif normalizasyonu ve mesafe', () => {
    expect(normalizeLabel('g00gle')).toBe('google');
    expect(normalizeLabel('rnicrosoft')).toBe('microsoft');
    expect(levenshtein('garanti', 'garantl')).toBe(1);
  });
});

describe('kaynak tespiti', () => {
  it('ham postayı ayırt eder', () => {
    expect(looksLikeRawMessage('From: a@b.com\nSubject: x\nDate: now\n\nmerhaba')).toBe(true);
    expect(looksLikeRawMessage('Merhaba, şu linke tıkla https://a.b')).toBe(false);
  });
});

describe('marka adı metinde', () => {
  it('kısa adları kelime içinde eşleştirmez', async () => {
    const { brandsInText } = await import('../src/domain.js');
    expect(brandsInText('Billing Team').map((b) => b.key)).not.toContain('ing');
    expect(brandsInText('Otherwise Support').map((b) => b.key)).not.toContain('wise');
    expect(brandsInText('ING Bank Security').map((b) => b.key)).toContain('ing');
    expect(brandsInText('Garanti BBVA Musteri Hizmetleri').map((b) => b.key)).toContain('garanti');
  });
});
