import { defineRule } from './common.js';
import { brandInSubdomain, matchBrand, splitDomain } from '../domain.js';
import type { LinkInfo, Rule } from '../types.js';

const webLinks = (links: LinkInfo[]) => links.filter((l) => l.scheme === 'http' || l.scheme === 'https');

function textLooksLikeUrl(text: string) {
  const t = text.trim();
  return /^(https?:\/\/|www\.)/i.test(t) || /^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(t);
}

const loginWords = /(login|giris|signin|sign-in|verify|dogrula|hesap|account|secure|guvenlik|sifre|password|update|guncelle|wallet)/i;

export const linkRules: Rule[] = [
  defineRule(
    {
      id: 'L01', layer: 'links', severity: 'critical', weight: 22,
      title: { en: 'Link text shows a different address than the real target', tr: 'Görünen bağlantı metni gerçek hedeften farklı' },
      why: {
        en: 'A link that reads "https://www.paypal.com" but goes somewhere else has no purpose other than to fool you.',
        tr: 'Metinde "https://www.ziraatbank.com.tr" yazıp aslında başka bir adrese götüren bağlantı, kullanıcıyı kandırmak dışında bir amaçla yapılmaz.',
      },
    },
    ({ mail }, hit) => {
      for (const l of webLinks(mail.links)) {
        if (l.source !== 'html' || !textLooksLikeUrl(l.text)) continue;
        const shown = l.text.trim().replace(/^https?:\/\//i, '').split('/')[0].toLowerCase();
        const shownReg = shown && splitDomain(shown).registrable;
        if (!shownReg || shownReg === l.registrable) continue;
        hit(
          { en: `The text shows ${shown}, the link goes to ${l.host}.`, tr: `Metin ${shown} gösteriyor, bağlantı ${l.host} adresine gidiyor.` },
          [`"${l.text}" -> ${l.href}`],
        );
      }
    },
  ),
  defineRule(
    {
      id: 'L02', layer: 'links', severity: 'high', weight: 18,
      title: { en: 'Link domain looks like a known brand', tr: 'Bağlantı alan adı bilinen bir markaya benziyor' },
      why: {
        en: 'Even if the sender looks clean, a link to a lookalike domain means the page behind it is a fake login form.',
        tr: 'Gönderen adresi temiz görünse bile bağlantı taklit bir alan adına gidiyorsa hedef sayfa sahte giriş formudur.',
      },
    },
    ({ mail }, hit) => {
      const seen = new Set<string>();
      for (const l of webLinks(mail.links)) {
        if (seen.has(l.registrable)) continue;
        const m = matchBrand(l.registrable);
        if (!m || m.kind === 'official') continue;
        seen.add(l.registrable);
        hit({ en: `${l.host} resembles ${m.brand.name} but is not official.`, tr: `${l.host}, ${m.brand.name} alan adını andırıyor ama resmi değil.` }, [l.href]);
      }
    },
  ),
  defineRule(
    {
      id: 'L03', layer: 'links', severity: 'high', weight: 16,
      title: { en: 'Brand name in the link\'s subdomain', tr: 'Marka adı bağlantının alt alan adında' },
      why: {
        en: 'In login.paypal.com.verify-now.xyz the real owner is verify-now.xyz. The left part is there to look trustworthy.',
        tr: 'hesap.garanti.com.tr.dogrula-simdi.xyz adresinde gerçek sahip dogrula-simdi.xyz\'dir; sol taraf güven vermek için eklenmiştir.',
      },
    },
    ({ mail }, hit) => {
      const seen = new Set<string>();
      for (const l of webLinks(mail.links)) {
        if (seen.has(l.host)) continue;
        const m = brandInSubdomain(l.host);
        if (!m || matchBrand(l.registrable)?.kind === 'official') continue;
        seen.add(l.host);
        hit(
          {
            en: `${l.host} uses ${m.brand.name} as a subdomain; the real owner is ${l.registrable}.`,
            tr: `${l.host} adresinde ${m.brand.name} adı alt alan adı; gerçek sahip ${l.registrable}.`,
          },
          [l.href],
        );
      }
    },
  ),
  defineRule(
    {
      id: 'L04', layer: 'links', severity: 'high', weight: 15,
      title: { en: 'Link points straight to an IP address', tr: 'Bağlantı doğrudan IP adresine gidiyor' },
      why: {
        en: 'Companies use domain names. Addresses like http://185.23.x.x/login are almost always throwaway phishing servers.',
        tr: 'Kurumlar alan adı kullanır. http://185.23.x.x/giris gibi adresler çoğunlukla geçici oltalama sunucularıdır.',
      },
    },
    ({ mail }, hit) => {
      for (const l of webLinks(mail.links)) if (l.isIp) hit({ en: l.href, tr: l.href }, [l.href]);
    },
  ),
  defineRule(
    {
      id: 'L05', layer: 'links', severity: 'medium', weight: 10,
      title: { en: 'Username trick in the link', tr: 'Bağlantıda kullanıcı adı hilesi' },
      why: {
        en: 'In https://paypal.com@bad.site everything before @ is ignored and the browser opens bad.site.',
        tr: 'https://ziraatbank.com.tr@kotu.site şeklindeki adreslerde @ işaretinden önceki kısım yok sayılır; tarayıcı kotu.site adresine gider.',
      },
    },
    ({ mail }, hit) => {
      for (const l of webLinks(mail.links)) if (l.flags.includes('userinfo')) hit({ en: l.href, tr: l.href }, [l.href]);
    },
  ),
  defineRule(
    {
      id: 'L06', layer: 'links', severity: 'medium', weight: 8,
      title: { en: 'Shortened link', tr: 'Kısaltılmış bağlantı' },
      why: {
        en: 'Shorteners like bit.ly hide the real target. Company notices do not use them. Resolve the target before you click.',
        tr: 'bit.ly gibi kısaltıcılar gerçek hedefi gizler. Kurumsal bildirimlerde beklenmez; tıklamadan önce hedefi çözmek gerekir.',
      },
    },
    ({ mail }, hit) => {
      for (const l of webLinks(mail.links)) {
        if (l.flags.includes('shortener')) hit({ en: `Link shortened with ${l.host}.`, tr: `${l.host} üzerinden kısaltılmış bağlantı.` }, [l.href]);
      }
    },
  ),
  defineRule(
    {
      id: 'L07', layer: 'links', severity: 'medium', weight: 10,
      title: { en: 'Link goes to a punycode domain', tr: 'Bağlantı punycode alan adına gidiyor' },
      why: {
        en: 'Domains written with non-Latin letters cannot be told apart by eye. "аpple.com" and "apple.com" look the same.',
        tr: 'Latin olmayan harflerle yazılmış alan adları gözle ayırt edilemez; "аpple.com" ile "apple.com" aynı görünür.',
      },
    },
    ({ mail }, hit) => {
      for (const l of webLinks(mail.links)) if (l.flags.includes('punycode')) hit({ en: l.host, tr: l.host }, [l.href]);
    },
  ),
  defineRule(
    {
      id: 'L08', layer: 'links', severity: 'medium', weight: 8,
      title: { en: 'Links go to domains other than the sender', tr: 'Bağlantılar gönderenden farklı alan adlarına gidiyor' },
      why: {
        en: 'A company notice links to its own domain. If none of the links belong to the sender, the content was probably copied from somewhere else.',
        tr: 'Bir kurumun bildirimi kendi alan adına bağlantı verir. Hiçbir bağlantının gönderen alan adıyla ilgisi yoksa içerik başka yerden kopyalanmış olabilir.',
      },
    },
    ({ mail }, hit) => {
      const f = mail.from?.registrable;
      const links = webLinks(mail.links);
      if (!f || links.length < 2 || links.some((l) => l.registrable === f)) return;
      const domains = [...new Set(links.map((l) => l.registrable))].slice(0, 4).join(', ');
      hit({
        en: `None of the ${links.length} links go to ${f} (${domains}).`,
        tr: `${links.length} bağlantının hiçbiri ${f} alan adına gitmiyor (${domains}).`,
      });
    },
  ),
  defineRule(
    {
      id: 'L09', layer: 'links', severity: 'high', weight: 14,
      title: { en: 'Login form inside the email', tr: 'Posta içinde giriş formu var' },
      why: {
        en: 'A form embedded in an email sends what you type straight to the attacker\'s server. Real companies never ask for a password inside the mail.',
        tr: 'E-posta içine gömülü form, bilgilerinizi doğrudan saldırganın sunucusuna gönderir. Meşru kurumlar postanın içinde şifre istemez.',
      },
    },
    ({ mail }, hit) => {
      if (mail.hasPasswordInput) hit({ en: 'The HTML contains a form with a password field.', tr: 'HTML içinde şifre alanı bulunan bir form var.' });
      else if (mail.hasForm) hit({ en: 'The HTML contains a form.', tr: 'HTML içinde bir form var.' });
    },
  ),
  defineRule(
    {
      id: 'L10', layer: 'links', severity: 'medium', weight: 10,
      title: { en: 'Script or data link', tr: 'Bağlantı betik ya da veri adresi' },
      why: {
        en: 'javascript: and data: links can run code in the browser or open a fake page from inside the mail itself.',
        tr: 'javascript: ve data: adresleri tarayıcıda doğrudan kod çalıştırabilir ya da sahte sayfayı postanın içinden açabilir.',
      },
    },
    ({ mail }, hit) => {
      for (const l of mail.links) {
        if (l.flags.includes('script-scheme')) hit({ en: `${l.scheme}: link.`, tr: `${l.scheme}: bağlantısı.` }, [l.href.slice(0, 120)]);
      }
    },
  ),
  defineRule(
    {
      id: 'L11', layer: 'links', severity: 'low', weight: 5,
      title: { en: 'Login-like link without HTTPS', tr: 'Giriş benzeri bağlantı şifresiz (http)' },
      why: {
        en: 'Account, login and verification pages always use https. Plain http is either careless or fake.',
        tr: 'Hesap, giriş ya da doğrulama sayfaları her zaman https kullanır. Düz http, ya özensiz ya da sahte bir altyapıdır.',
      },
    },
    ({ mail }, hit) => {
      for (const l of mail.links) if (l.scheme === 'http' && loginWords.test(l.href)) hit({ en: l.href, tr: l.href }, [l.href]);
    },
  ),
  defineRule(
    {
      id: 'L12', layer: 'links', severity: 'low', weight: 5,
      title: { en: 'Unusual link structure', tr: 'Alışılmadık bağlantı yapısı' },
      why: {
        en: 'Very deep subdomains, odd ports or heavily encoded parameters are ways to hide where a link really goes.',
        tr: 'Çok derin alt alan adı, olağan dışı port ya da yoğun kodlanmış parametreler, gerçek hedefi gizlemek için kullanılan tekniklerdir.',
      },
    },
    ({ mail }, hit) => {
      for (const l of webLinks(mail.links)) {
        const odd = l.flags.filter((f) => ['deep-subdomain', 'odd-port', 'encoded', 'long'].includes(f));
        if (odd.length) hit({ en: `${l.host}: ${odd.join(', ')}.`, tr: `${l.host}: ${odd.join(', ')}.` }, [l.href]);
      }
    },
  ),
];
