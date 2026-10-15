import { parse } from 'tldts';

export interface Brand {
  key: string;
  name: string;
  domains: string[];
  keywords: string[];
}

export const brands: Brand[] = [
  { key: 'ziraat', name: 'Ziraat Bankası', domains: ['ziraatbank.com.tr'], keywords: ['ziraat', 'ziraatbank'] },
  { key: 'garanti', name: 'Garanti BBVA', domains: ['garantibbva.com.tr', 'garanti.com.tr'], keywords: ['garanti', 'garantibbva'] },
  { key: 'isbank', name: 'İş Bankası', domains: ['isbank.com.tr'], keywords: ['isbank', 'isbankasi'] },
  { key: 'akbank', name: 'Akbank', domains: ['akbank.com'], keywords: ['akbank'] },
  { key: 'yapikredi', name: 'Yapı Kredi', domains: ['yapikredi.com.tr'], keywords: ['yapikredi'] },
  { key: 'halkbank', name: 'Halkbank', domains: ['halkbank.com.tr'], keywords: ['halkbank'] },
  { key: 'vakifbank', name: 'VakıfBank', domains: ['vakifbank.com.tr'], keywords: ['vakifbank'] },
  { key: 'denizbank', name: 'DenizBank', domains: ['denizbank.com'], keywords: ['denizbank'] },
  { key: 'qnb', name: 'QNB', domains: ['qnb.com.tr', 'qnbfinansbank.com'], keywords: ['qnbfinansbank', 'finansbank'] },
  { key: 'teb', name: 'TEB', domains: ['teb.com.tr'], keywords: ['tebbank'] },
  { key: 'enpara', name: 'Enpara', domains: ['enpara.com'], keywords: ['enpara'] },
  { key: 'papara', name: 'Papara', domains: ['papara.com'], keywords: ['papara'] },
  { key: 'ptt', name: 'PTT', domains: ['ptt.gov.tr', 'pttavm.com'], keywords: ['pttavm', 'pttkargo'] },
  { key: 'edevlet', name: 'e-Devlet', domains: ['turkiye.gov.tr'], keywords: ['edevlet', 'turkiyegov'] },
  { key: 'gib', name: 'Gelir İdaresi', domains: ['gib.gov.tr'], keywords: ['geliridaresi', 'vergidairesi'] },
  { key: 'sgk', name: 'SGK', domains: ['sgk.gov.tr'], keywords: ['sgkgov'] },
  { key: 'trendyol', name: 'Trendyol', domains: ['trendyol.com'], keywords: ['trendyol'] },
  { key: 'hepsiburada', name: 'Hepsiburada', domains: ['hepsiburada.com'], keywords: ['hepsiburada'] },
  { key: 'n11', name: 'n11', domains: ['n11.com'], keywords: ['n11com'] },
  { key: 'sahibinden', name: 'sahibinden', domains: ['sahibinden.com'], keywords: ['sahibinden'] },
  { key: 'getir', name: 'Getir', domains: ['getir.com'], keywords: ['getirapp'] },
  { key: 'yemeksepeti', name: 'Yemeksepeti', domains: ['yemeksepeti.com'], keywords: ['yemeksepeti'] },
  { key: 'turkcell', name: 'Turkcell', domains: ['turkcell.com.tr'], keywords: ['turkcell'] },
  { key: 'vodafone', name: 'Vodafone', domains: ['vodafone.com.tr', 'vodafone.com'], keywords: ['vodafone'] },
  { key: 'turktelekom', name: 'Türk Telekom', domains: ['turktelekom.com.tr'], keywords: ['turktelekom'] },
  { key: 'yurtici', name: 'Yurtiçi Kargo', domains: ['yurticikargo.com'], keywords: ['yurticikargo', 'yurtici'] },
  { key: 'aras', name: 'Aras Kargo', domains: ['araskargo.com.tr'], keywords: ['araskargo'] },
  { key: 'mng', name: 'MNG Kargo', domains: ['mngkargo.com.tr'], keywords: ['mngkargo'] },
  { key: 'surat', name: 'Sürat Kargo', domains: ['suratkargo.com.tr'], keywords: ['suratkargo'] },
  { key: 'dhl', name: 'DHL', domains: ['dhl.com', 'dhl.com.tr'], keywords: ['dhlexpress', 'dhlkargo'] },
  { key: 'ups', name: 'UPS', domains: ['ups.com'], keywords: ['upskargo'] },
  { key: 'fedex', name: 'FedEx', domains: ['fedex.com'], keywords: ['fedex'] },
  { key: 'google', name: 'Google', domains: ['google.com', 'gmail.com', 'googlemail.com', 'youtube.com'], keywords: ['google', 'gmail'] },
  { key: 'microsoft', name: 'Microsoft', domains: ['microsoft.com', 'outlook.com', 'live.com', 'hotmail.com', 'office.com', 'microsoftonline.com', 'sharepoint.com'], keywords: ['microsoft', 'outlook', 'office365', 'onedrive', 'sharepoint'] },
  { key: 'apple', name: 'Apple', domains: ['apple.com', 'icloud.com', 'me.com'], keywords: ['apple', 'icloud', 'appleid'] },
  { key: 'amazon', name: 'Amazon', domains: ['amazon.com', 'amazon.com.tr', 'amazon.de'], keywords: ['amazon'] },
  { key: 'paypal', name: 'PayPal', domains: ['paypal.com'], keywords: ['paypal'] },
  { key: 'netflix', name: 'Netflix', domains: ['netflix.com'], keywords: ['netflix'] },
  { key: 'spotify', name: 'Spotify', domains: ['spotify.com'], keywords: ['spotify'] },
  { key: 'instagram', name: 'Instagram', domains: ['instagram.com'], keywords: ['instagram'] },
  { key: 'facebook', name: 'Facebook', domains: ['facebook.com', 'facebookmail.com', 'meta.com'], keywords: ['facebook'] },
  { key: 'whatsapp', name: 'WhatsApp', domains: ['whatsapp.com'], keywords: ['whatsapp'] },
  { key: 'linkedin', name: 'LinkedIn', domains: ['linkedin.com'], keywords: ['linkedin'] },
  { key: 'steam', name: 'Steam', domains: ['steampowered.com', 'steamcommunity.com'], keywords: ['steampowered', 'steamcommunity'] },
  { key: 'binance', name: 'Binance', domains: ['binance.com', 'binance.tr'], keywords: ['binance'] },
  { key: 'dropbox', name: 'Dropbox', domains: ['dropbox.com'], keywords: ['dropbox'] },
  { key: 'docusign', name: 'DocuSign', domains: ['docusign.com', 'docusign.net'], keywords: ['docusign'] },
  { key: 'chase', name: 'Chase', domains: ['chase.com', 'jpmorganchase.com'], keywords: ['chasebank', 'jpmorgan'] },
  { key: 'bofa', name: 'Bank of America', domains: ['bankofamerica.com', 'bofa.com'], keywords: ['bankofamerica'] },
  { key: 'wellsfargo', name: 'Wells Fargo', domains: ['wellsfargo.com'], keywords: ['wellsfargo'] },
  { key: 'citi', name: 'Citibank', domains: ['citi.com', 'citibank.com'], keywords: ['citibank'] },
  { key: 'hsbc', name: 'HSBC', domains: ['hsbc.com', 'hsbc.co.uk'], keywords: ['hsbcbank'] },
  { key: 'barclays', name: 'Barclays', domains: ['barclays.co.uk', 'barclays.com'], keywords: ['barclays'] },
  { key: 'lloyds', name: 'Lloyds Bank', domains: ['lloydsbank.com', 'lloydsbank.co.uk'], keywords: ['lloydsbank'] },
  { key: 'santander', name: 'Santander', domains: ['santander.com', 'santander.co.uk', 'santander.de'], keywords: ['santander'] },
  { key: 'ing', name: 'ING', domains: ['ing.com', 'ing.de', 'ing.nl'], keywords: ['ingbank'] },
  { key: 'deutschebank', name: 'Deutsche Bank', domains: ['deutsche-bank.de', 'db.com'], keywords: ['deutschebank'] },
  { key: 'sparkasse', name: 'Sparkasse', domains: ['sparkasse.de'], keywords: ['sparkasse'] },
  { key: 'revolut', name: 'Revolut', domains: ['revolut.com'], keywords: ['revolut'] },
  { key: 'wise', name: 'Wise', domains: ['wise.com', 'transferwise.com'], keywords: ['transferwise'] },
  { key: 'stripe', name: 'Stripe', domains: ['stripe.com'], keywords: ['stripe'] },
  { key: 'coinbase', name: 'Coinbase', domains: ['coinbase.com'], keywords: ['coinbase'] },
  { key: 'metamask', name: 'MetaMask', domains: ['metamask.io'], keywords: ['metamask'] },
  { key: 'usps', name: 'USPS', domains: ['usps.com'], keywords: ['uspstrack', 'uspsdelivery'] },
  { key: 'royalmail', name: 'Royal Mail', domains: ['royalmail.com'], keywords: ['royalmail'] },
  { key: 'dpd', name: 'DPD', domains: ['dpd.com', 'dpd.co.uk', 'dpd.de'], keywords: ['dpdgroup', 'dpdparcel'] },
  { key: 'ebay', name: 'eBay', domains: ['ebay.com', 'ebay.co.uk', 'ebay.de'], keywords: ['ebayinc'] },
  { key: 'adobe', name: 'Adobe', domains: ['adobe.com'], keywords: ['adobe'] },
  { key: 'zoom', name: 'Zoom', domains: ['zoom.us', 'zoom.com'], keywords: ['zoommeeting'] },
  { key: 'slack', name: 'Slack', domains: ['slack.com'], keywords: ['slackhq'] },
  { key: 'github', name: 'GitHub', domains: ['github.com', 'githubusercontent.com'], keywords: ['github'] },
  { key: 'x', name: 'X (Twitter)', domains: ['x.com', 'twitter.com'], keywords: ['twitter'] },
  { key: 'tiktok', name: 'TikTok', domains: ['tiktok.com'], keywords: ['tiktok'] },
  { key: 'booking', name: 'Booking.com', domains: ['booking.com'], keywords: ['bookingcom'] },
  { key: 'airbnb', name: 'Airbnb', domains: ['airbnb.com'], keywords: ['airbnb'] },
  { key: 'irs', name: 'IRS', domains: ['irs.gov'], keywords: ['irsgov', 'irsrefund'] },
  { key: 'hmrc', name: 'HMRC', domains: ['gov.uk'], keywords: ['hmrcgov', 'hmrcrefund'] },
];

export const freeMailDomains = new Set([
  'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'yahoo.com', 'yahoo.com.tr',
  'yandex.com', 'yandex.ru', 'mail.ru', 'icloud.com', 'protonmail.com', 'proton.me', 'gmx.com', 'gmx.de',
  'aol.com', 'mynet.com', 'zoho.com', 'tutanota.com',
]);

export const shortenerDomains = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 'cutt.ly', 'rb.gy', 'shorturl.at',
  'tiny.cc', 'lnkd.in', 'rebrand.ly', 't.ly', 'kisa.link', 'bit.do', 'qrco.de',
]);

export const riskyTlds = new Set([
  'xyz', 'top', 'icu', 'click', 'link', 'work', 'zip', 'mov', 'cam', 'rest', 'buzz', 'tk', 'ml', 'ga', 'cf',
  'gq', 'cfd', 'sbs', 'monster', 'quest', 'bond', 'lol', 'live', 'online', 'site', 'website', 'space', 'fun',
  'surf', 'pw', 'ru', 'su', 'cn', 'cyou', 'shop', 'store', 'vip',
]);

export function splitDomain(host: string) {
  const lower = host.trim().toLowerCase().replace(/\.$/, '');
  const info = parse(lower, { allowPrivateDomains: false });
  return {
    host: lower,
    registrable: info.domain ?? lower,
    sld: info.domainWithoutSuffix ?? lower.split('.')[0] ?? lower,
    suffix: info.publicSuffix ?? '',
    subdomain: info.subdomain ?? '',
    isIp: Boolean(info.isIp),
    isIcann: info.isIcann === true,
  };
}

export function isPunycode(host: string) {
  return host.toLowerCase().split('.').some((label) => label.startsWith('xn--'));
}

const homoglyphs: Record<string, string> = {
  '0': 'o', '1': 'l', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '9': 'g', '@': 'a', '$': 's',
  'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'у': 'y', 'х': 'x', 'і': 'i', 'ѕ': 's', 'ј': 'j',
  'ı': 'i', 'ş': 's', 'ç': 'c', 'ğ': 'g', 'ü': 'u', 'ö': 'o',
};

export function normalizeLabel(label: string) {
  let out = '';
  for (const ch of label.toLowerCase()) out += homoglyphs[ch] ?? ch;
  return out.replace(/rn/g, 'm').replace(/vv/g, 'w').replace(/cl/g, 'd').replace(/[^a-z0-9]/g, '');
}

export function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  const prev = new Array(b.length + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let left = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const cur = Math.min(prev[j] + 1, left + 1, prev[j - 1] + cost);
      prev[j - 1] = left;
      left = cur;
    }
    prev[b.length] = left;
  }
  return prev[b.length];
}

export interface BrandMatch {
  brand: Brand;
  kind: 'official' | 'lookalike' | 'contains';
  keyword: string;
}

export function matchBrand(host: string): BrandMatch | null {
  const { registrable, sld, host: lower } = splitDomain(host);
  for (const brand of brands) {
    if (brand.domains.some((d) => registrable === d || lower === d || lower.endsWith('.' + d))) {
      return { brand, kind: 'official', keyword: registrable };
    }
  }
  const normalized = normalizeLabel(sld);
  const rawCompact = sld.replace(/[^a-z0-9]/gi, '').toLowerCase();
  for (const brand of brands) {
    for (const keyword of brand.keywords) {
      if (normalized === keyword || rawCompact === keyword) return { brand, kind: 'lookalike', keyword };
      const limit = keyword.length >= 9 ? 2 : keyword.length >= 5 ? 1 : 0;
      if (limit && levenshtein(normalized, keyword) <= limit) return { brand, kind: 'lookalike', keyword };
    }
  }
  for (const brand of brands) {
    for (const keyword of brand.keywords) {
      if (keyword.length >= 5 && (normalized.includes(keyword) || rawCompact.includes(keyword))) {
        return { brand, kind: 'contains', keyword };
      }
    }
  }
  return null;
}

export function brandInSubdomain(host: string): BrandMatch | null {
  const { subdomain } = splitDomain(host);
  if (!subdomain) return null;
  for (const label of subdomain.split('.')) {
    const normalized = normalizeLabel(label);
    for (const brand of brands) {
      for (const keyword of brand.keywords) {
        if (keyword.length >= 5 && normalized.includes(keyword)) return { brand, kind: 'contains', keyword };
      }
    }
  }
  return null;
}

export function brandsInText(text: string): Brand[] {
  const normalized = normalizeLabel(text.replace(/\s+/g, ''));
  const plain = text.toLowerCase();
  const found: Brand[] = [];
  for (const brand of brands) {
    const escaped = brand.name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nameHit = new RegExp('(?<![\\p{L}\\d])' + escaped + '(?![\\p{L}\\d])', 'u').test(plain);
    const keyHit = brand.keywords.some((k) => k.length >= 5 && normalized.includes(k));
    if (nameHit || keyHit) found.push(brand);
  }
  return found;
}
