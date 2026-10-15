import { defineRule } from './common.js';
import { brandInSubdomain, freeMailDomains, isPunycode, matchBrand, riskyTlds, splitDomain } from '../domain.js';
import type { Rule } from '../types.js';

const corporate = /(?<!\p{L})(banka|bankasi|bank|hesab|hesap|account|fatura|invoice|billing|kargo|gönderi|gonderi|teslimat|delivery|shipment|parcel|vergi|tax|sgk|e-devlet|müşteri hizmetleri|musteri hizmetleri|customer service|güvenlik ekibi|security team|account team|support team)(?!\p{L})/iu;

export const domainRules: Rule[] = [
  defineRule(
    {
      id: 'N01', layer: 'domain', severity: 'critical', weight: 25,
      title: { en: 'Sender domain looks like a known brand', tr: 'Gönderen alan adı bilinen bir markaya benziyor' },
      why: {
        en: 'Swapped letters (paypa1, g00gle), extra words (paypal-security) or another extension (.xyz) are the basic tools of phishing domains.',
        tr: 'Harf değiştirme (garantl, z1raat), ek kelime (garanti-guvenlik) ya da başka uzantı (.xyz) ile kurum adını taklit eden alan adları oltalamanın temel aracıdır.',
      },
    },
    ({ mail }, hit) => {
      if (!mail.from) return;
      const m = matchBrand(mail.from.registrable);
      if (!m || m.kind === 'official') return;
      const official = m.brand.domains[0];
      hit(
        {
          en: `${mail.from.domain} resembles ${m.brand.name} (${official}) but is not an official domain.`,
          tr: `${mail.from.domain}, ${m.brand.name} (${official}) alan adını andırıyor ama resmi değil.`,
        },
        [`From: ${mail.from.address}`],
      );
    },
  ),
  defineRule(
    {
      id: 'N02', layer: 'domain', severity: 'high', weight: 15,
      title: { en: 'Brand name used as a subdomain', tr: 'Marka adı alt alan adında' },
      why: {
        en: 'In an address like paypal.com.account-check.xyz, the owner is the rightmost domain. The brand on the left is just decoration.',
        tr: 'garanti.com.tr.hesap-dogrula.xyz gibi adreslerde asıl sahip en sağdaki alan adıdır; soldaki marka adı yalnızca göz boyamak içindir.',
      },
    },
    ({ mail }, hit) => {
      if (!mail.from) return;
      const m = brandInSubdomain(mail.from.domain);
      if (!m) return;
      hit(
        {
          en: `${mail.from.domain} uses ${m.brand.name} as a subdomain; the real owner is ${mail.from.registrable}.`,
          tr: `${mail.from.domain} adresinde ${m.brand.name} adı alt alan adı olarak kullanılmış; gerçek sahip ${mail.from.registrable}.`,
        },
        [`From: ${mail.from.address}`],
      );
    },
  ),
  defineRule(
    {
      id: 'N03', layer: 'domain', severity: 'high', weight: 12,
      title: { en: 'Sender domain uses punycode', tr: 'Gönderen alan adı punycode içeriyor' },
      why: {
        en: 'Labels starting with xn-- carry non-Latin letters. They can look exactly like "apple.com" and lead somewhere else entirely.',
        tr: 'xn-- ile başlayan etiketler Latin olmayan harfler taşır. "аpple.com" gibi görünüp bambaşka bir alan adına gidebilir.',
      },
    },
    ({ mail }, hit) => {
      if (!mail.from || !isPunycode(mail.from.domain)) return;
      hit({ en: `${mail.from.domain} contains a punycode label.`, tr: `${mail.from.domain} punycode etiketi içeriyor.` }, [`From: ${mail.from.address}`]);
    },
  ),
  defineRule(
    {
      id: 'N04', layer: 'domain', severity: 'low', weight: 6,
      title: { en: 'Risky top-level domain', tr: 'Riskli üst seviye alan adı' },
      why: {
        en: 'Free or very cheap extensions (.xyz, .top, .icu, .tk) show up in phishing campaigns far more than elsewhere. It is not proof on its own.',
        tr: 'Ücretsiz ya da çok ucuz uzantılar (.xyz, .top, .icu, .tk) oltalama kampanyalarında orantısız sıklıkta kullanılır. Tek başına kanıt değildir.',
      },
    },
    ({ mail }, hit) => {
      if (!mail.from) return;
      const tld = splitDomain(mail.from.domain).suffix.split('.').pop() ?? '';
      if (!riskyTlds.has(tld)) return;
      hit({ en: `Sender uses .${tld}.`, tr: `Gönderen uzantısı .${tld}.` }, [`From: ${mail.from.address}`]);
    },
  ),
  defineRule(
    {
      id: 'N05', layer: 'domain', severity: 'medium', weight: 8,
      title: { en: 'Company notice sent from a free mailbox', tr: 'Kurumsal içerik ücretsiz posta hesabından' },
      why: {
        en: 'A bank, courier or government notice is not sent from gmail.com or outlook.com.',
        tr: 'Banka, kargo ya da kamu kurumu adına gelen bir bildirim gmail.com veya outlook.com gibi bireysel hesaplardan gönderilmez.',
      },
    },
    ({ mail }, hit) => {
      const from = mail.from;
      if (!from || !freeMailDomains.has(from.registrable)) return;
      if (!corporate.test(mail.subject) && !corporate.test(from.name)) return;
      hit(
        { en: `The subject or name looks like a company notice, but it was sent from ${from.domain}.`, tr: `Konu/ad kurumsal bir bildirim gibi ama gönderen ${from.domain}.` },
        [`From: ${from.name} <${from.address}>`, `Subject: ${mail.subject}`],
      );
    },
  ),
  defineRule(
    {
      id: 'N06', layer: 'domain', severity: 'low', weight: 5,
      title: { en: 'Domain padded with numbers and hyphens', tr: 'Gönderen alan adı sayı ve tire ile doldurulmuş' },
      why: {
        en: 'Generated domains like secure-login-8831.com usually belong to short-lived phishing infrastructure.',
        tr: 'Otomatik üretilmiş alan adları (secure-login-8831.com) genelde kısa ömürlü oltalama altyapısına aittir.',
      },
    },
    ({ mail }, hit) => {
      if (!mail.from) return;
      const { sld } = splitDomain(mail.from.domain);
      if ((sld.match(/-/g)?.length ?? 0) < 2 && !/\d{3,}/.test(sld)) return;
      hit({ en: `Domain label: ${sld}.`, tr: `Alan adı etiketi: ${sld}.` }, [`From: ${mail.from.address}`]);
    },
  ),
];
