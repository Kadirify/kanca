import { defineRule } from './common.js';
import type { Rule } from '../types.js';

export const attachmentRules: Rule[] = [
  defineRule(
    {
      id: 'A01', layer: 'attachments', severity: 'critical', weight: 30,
      title: { en: 'Executable attachment', tr: 'Çalıştırılabilir ek' },
      why: {
        en: 'Files like .exe, .js, .vbs, .scr or .lnk run code the moment they are opened. No company sends an invoice or document this way.',
        tr: '.exe, .js, .vbs, .scr, .lnk gibi dosyalar açıldığı anda kod çalıştırır. Hiçbir kurum fatura ya da belgeyi bu biçimde göndermez.',
      },
    },
    ({ mail }, hit) => {
      for (const a of mail.attachments) {
        if (a.flags.includes('executable')) hit({ en: `${a.filename} (${a.contentType}).`, tr: `${a.filename} (${a.contentType}).` }, [a.filename]);
      }
    },
  ),
  defineRule(
    {
      id: 'A02', layer: 'attachments', severity: 'high', weight: 20,
      title: { en: 'Double file extension', tr: 'Çift uzantılı dosya adı' },
      why: {
        en: 'A name like invoice.pdf.exe shows up as "invoice.pdf" on systems that hide extensions. The goal is to mislead.',
        tr: 'fatura.pdf.exe gibi adlar, uzantıyı gizleyen sistemlerde "fatura.pdf" olarak görünür. Amaç kullanıcıyı yanıltmaktır.',
      },
    },
    ({ mail }, hit) => {
      for (const a of mail.attachments) if (a.flags.includes('double-extension')) hit({ en: a.filename, tr: a.filename }, [a.filename]);
    },
  ),
  defineRule(
    {
      id: 'A03', layer: 'attachments', severity: 'high', weight: 18,
      title: { en: 'Office file that can carry macros', tr: 'Makro içerebilen Office dosyası' },
      why: {
        en: 'Extensions like .docm and .xlsm carry macros. "Enable content" and the malware download starts. The trick has not changed in years.',
        tr: '.docm, .xlsm gibi uzantılar makro taşır; "içeriği etkinleştir" dedirtip zararlı yazılım indirme yöntemi yıllardır değişmedi.',
      },
    },
    ({ mail }, hit) => {
      for (const a of mail.attachments) if (a.flags.includes('macro')) hit({ en: a.filename, tr: a.filename }, [a.filename]);
    },
  ),
  defineRule(
    {
      id: 'A04', layer: 'attachments', severity: 'medium', weight: 12,
      title: { en: 'Archive or disk image attached', tr: 'Arşiv ya da disk imajı eki' },
      why: {
        en: '.zip, .rar, .iso and .img files are used to slip past mail gateway scanning. There is usually an executable inside.',
        tr: '.zip, .rar, .iso, .img dosyaları posta ağ geçitlerinin taramasını atlatmak için kullanılır; içinde çoğunlukla çalıştırılabilir dosya vardır.',
      },
    },
    ({ mail }, hit) => {
      for (const a of mail.attachments) {
        if (!a.flags.includes('archive')) continue;
        const kb = Math.round(a.size / 1024);
        hit({ en: `${a.filename} (${kb} KB).`, tr: `${a.filename} (${kb} KB).` }, [a.filename]);
      }
    },
  ),
  defineRule(
    {
      id: 'A05', layer: 'attachments', severity: 'high', weight: 16,
      title: { en: 'HTML attachment', tr: 'HTML ek' },
      why: {
        en: 'An attached .html file opens locally in the browser and shows a fake login page. URL filters never see it.',
        tr: 'Ek olarak gelen .html dosyası tarayıcıda yerel olarak açılır ve sahte giriş sayfası gösterir; URL filtreleri bunu göremez.',
      },
    },
    ({ mail }, hit) => {
      for (const a of mail.attachments) if (a.flags.includes('web')) hit({ en: a.filename, tr: a.filename }, [a.filename]);
    },
  ),
  defineRule(
    {
      id: 'A06', layer: 'attachments', severity: 'low', weight: 6,
      title: { en: 'Attachment may be a QR code', tr: 'Ekte QR kod görseli olabilir' },
      why: {
        en: 'QR phishing hides the link inside an image, so text filters cannot see it. Think twice before scanning it with your phone.',
        tr: 'QR kodlu oltalama (quishing) bağlantıyı görselin içine saklar; metin tabanlı filtreler bağlantıyı göremez. Telefonla okutmadan önce şüphelenin.',
      },
    },
    ({ mail }, hit) => {
      for (const a of mail.attachments) if (a.flags.includes('qr')) hit({ en: a.filename, tr: a.filename }, [a.filename]);
    },
  ),
];
