import { defineRule } from './common.js';
import { freeMailDomains } from '../domain.js';
import type { Rule } from '../types.js';

export const dnsRules: Rule[] = [
  defineRule(
    {
      id: 'D01', layer: 'dns', severity: 'high', weight: 18,
      title: { en: 'Sender domain has no mail server', tr: 'Gönderen alan adının posta sunucusu yok' },
      why: {
        en: 'A real company domain has MX records. A domain with neither MX nor A records cannot receive mail. It was set up to send and disappear.',
        tr: 'Gerçek bir kurumun alan adında MX kaydı bulunur. MX ve A kaydı olmayan bir alan adı posta alamaz; yalnızca gönderip kaybolmak için kurulmuştur.',
      },
    },
    ({ mail, dns }, hit) => {
      if (!dns || !mail.from || dns.mx !== false || dns.a !== false) return;
      hit({ en: `No MX or A record found for ${mail.from.domain}.`, tr: `${mail.from.domain} için MX ve A kaydı bulunamadı.` });
    },
  ),
  defineRule(
    {
      id: 'D02', layer: 'dns', severity: 'medium', weight: 10,
      title: { en: 'SPF record missing or open to everyone', tr: 'SPF kaydı yok ya da herkese açık' },
      why: {
        en: 'A domain without SPF, or with "+all", puts no limit on who can send mail in its name.',
        tr: 'SPF kaydı olmayan ya da "+all" ile herkese izin veren bir alan adı, kim olursa olsun o adla posta göndermesine engel koymamıştır.',
      },
    },
    ({ mail, dns }, hit) => {
      if (!dns || !mail.from || freeMailDomains.has(mail.from.registrable)) return;
      const d = mail.from.registrable;
      if (dns.spf === '') hit({ en: `${d} has no SPF record.`, tr: `${d} için SPF kaydı yok.` });
      else if (dns.spf && /\s\+all\b/i.test(dns.spf)) hit({ en: 'The SPF record ends with "+all" and allows any server.', tr: 'SPF kaydı "+all" içeriyor; her sunucuya izin veriyor.' }, [dns.spf]);
    },
  ),
  defineRule(
    {
      id: 'D03', layer: 'dns', severity: 'medium', weight: 10,
      title: { en: 'No enforced DMARC policy', tr: 'DMARC politikası yok ya da uygulanmıyor' },
      why: {
        en: 'Without DMARC, or with p=none, receiving servers still deliver spoofed mail. Banks and large companies use p=reject.',
        tr: 'DMARC kaydı olmayan ya da p=none olan alan adları taklit edilince alıcı sunucular postayı yine de teslim eder. Bankalar ve büyük kurumlar p=reject kullanır.',
      },
    },
    ({ mail, dns }, hit) => {
      if (!dns || !mail.from || freeMailDomains.has(mail.from.registrable)) return;
      const d = mail.from.registrable;
      if (dns.dmarc === '') hit({ en: `${d} has no DMARC record.`, tr: `${d} için DMARC kaydı yok.` });
      else if (dns.dmarc && /\bp=none\b/i.test(dns.dmarc)) hit({ en: 'DMARC policy is p=none, so spoofed mail is not rejected.', tr: 'DMARC politikası p=none; taklit postalar reddedilmiyor.' }, [dns.dmarc]);
    },
  ),
];
