import { defineRule } from './common.js';
import { brandsInText, freeMailDomains } from '../domain.js';
import type { Rule } from '../types.js';

const privateIp = /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|fe80:|::1$|fc|fd)/i;

export const headerRules: Rule[] = [
  defineRule(
    {
      id: 'H01', layer: 'headers', severity: 'critical', weight: 25,
      title: { en: 'DMARC check failed', tr: 'DMARC doğrulaması başarısız' },
      why: {
        en: 'DMARC catches mail that the owner of the sender domain did not authorize. A fail is the strongest sign that the address is spoofed.',
        tr: 'DMARC, gönderen alan adının sahibi tarafından yetkilendirilmemiş postaları yakalar. Başarısız sonuç, adresin taklit edildiğine en güçlü işarettir.',
      },
    },
    ({ mail }, hit) => {
      if (mail.auth.dmarc !== 'fail') return;
      hit(
        { en: 'The receiving server marked DMARC as "fail".', tr: 'Alıcı sunucu DMARC sonucunu "fail" olarak işaretlemiş.' },
        mail.auth.raw.filter((l) => /dmarc=/i.test(l)),
      );
    },
  ),
  defineRule(
    {
      id: 'H02', layer: 'headers', severity: 'high', weight: 15,
      title: { en: 'SPF check failed', tr: 'SPF doğrulaması başarısız' },
      why: {
        en: 'SPF says whether the sending server is allowed to send for the domain. Fail or softfail means the mail came from a server the domain does not trust.',
        tr: 'SPF, posta gönderen sunucunun alan adı adına yetkili olup olmadığını söyler. Fail ya da softfail, yetkisiz bir sunucudan gönderim demektir.',
      },
    },
    ({ mail }, hit) => {
      const spf = mail.auth.spf;
      if (spf !== 'fail' && spf !== 'softfail' && spf !== 'permerror') return;
      hit({ en: `SPF result: ${spf}.`, tr: `SPF sonucu: ${spf}.` }, mail.auth.raw.filter((l) => /spf/i.test(l)));
    },
  ),
  defineRule(
    {
      id: 'H03', layer: 'headers', severity: 'medium', weight: 10,
      title: { en: 'DKIM signature is invalid', tr: 'DKIM imzası geçersiz' },
      why: {
        en: 'DKIM proves the message was signed by the domain owner and was not changed on the way. An invalid signature means it was altered or forged.',
        tr: 'DKIM, postanın yolda değiştirilmediğini ve alan adı sahibinin anahtarıyla imzalandığını kanıtlar. Geçersiz imza, içeriğin değiştirildiğini ya da taklit edildiğini gösterir.',
      },
    },
    ({ mail }, hit) => {
      const dkim = mail.auth.dkim;
      if (dkim !== 'fail' && dkim !== 'permerror') return;
      hit({ en: `DKIM result: ${dkim}.`, tr: `DKIM sonucu: ${dkim}.` }, mail.auth.raw.filter((l) => /dkim=/i.test(l)));
    },
  ),
  defineRule(
    {
      id: 'H04', layer: 'headers', severity: 'low', weight: 4,
      title: { en: 'No authentication results', tr: 'Kimlik doğrulama bilgisi yok' },
      why: {
        en: 'There is no SPF, DKIM or DMARC result in the message. Either the receiving server did not check, or the source was pasted incomplete. The sender cannot be verified.',
        tr: 'Postada SPF/DKIM/DMARC sonucu bulunmuyor. Alıcı sunucu kontrol etmemiş ya da kaynak eksik yapıştırılmış olabilir; kimlik doğrulanamıyor.',
      },
    },
    ({ mail }, hit) => {
      if (!mail.hasHeaders || mail.auth.spf || mail.auth.dkim || mail.auth.dmarc) return;
      hit({ en: 'No Authentication-Results or Received-SPF header.', tr: 'Authentication-Results ya da Received-SPF başlığı yok.' });
    },
  ),
  defineRule(
    {
      id: 'H05', layer: 'headers', severity: 'high', weight: 15,
      title: { en: 'Sender and return path use different domains', tr: 'Gönderen ile dönüş yolu farklı alan adında' },
      why: {
        en: 'Return-Path is the real envelope address where bounces go. When it points to a different domain than From, the visible sender is usually fake.',
        tr: 'Return-Path, geri dönen postaların gideceği gerçek zarf adresidir. From alanından farklı bir alan adı göstermesi, görünen gönderenin sahte olduğunun klasik işaretidir.',
      },
    },
    ({ mail }, hit) => {
      const f = mail.from?.registrable;
      const r = mail.returnPath?.registrable;
      if (!f || !r || f === r || freeMailDomains.has(r)) return;
      hit(
        { en: `From: ${mail.from!.domain}, Return-Path: ${mail.returnPath!.domain}.`, tr: `From: ${mail.from!.domain}, Return-Path: ${mail.returnPath!.domain}.` },
        [`From: ${mail.from!.address}`, `Return-Path: ${mail.returnPath!.address}`],
      );
    },
  ),
  defineRule(
    {
      id: 'H06', layer: 'headers', severity: 'medium', weight: 12,
      title: { en: 'Reply-To differs from the sender', tr: 'Yanıt adresi gönderenden farklı' },
      why: {
        en: 'If Reply-To points to another domain, hitting "Reply" sends your answer to the attacker instead of the sender you see.',
        tr: 'Reply-To farklı bir alan adını gösteriyorsa, "Yanıtla" dediğinizde mesaj görünen gönderene değil saldırganın kutusuna gider.',
      },
    },
    ({ mail }, hit) => {
      const f = mail.from?.registrable;
      const r = mail.replyTo?.registrable;
      if (!f || !r || f === r) return;
      hit(
        { en: `From: ${mail.from!.domain}, Reply-To: ${mail.replyTo!.domain}.`, tr: `From: ${mail.from!.domain}, Reply-To: ${mail.replyTo!.domain}.` },
        [`From: ${mail.from!.address}`, `Reply-To: ${mail.replyTo!.address}`],
      );
    },
  ),
  defineRule(
    {
      id: 'H07', layer: 'headers', severity: 'high', weight: 15,
      title: { en: 'Display name contains another email address', tr: 'Görünen ad başka bir e-posta adresi içeriyor' },
      why: {
        en: 'Mobile mail apps often show only the display name. Putting a fake address there is a common way to hide the real sender.',
        tr: 'Mobil istemciler çoğu zaman yalnızca görünen adı gösterir. Görünen ada sahte bir adres yazmak, gerçek gönderen adresini gizlemenin yaygın yoludur.',
      },
    },
    ({ mail }, hit) => {
      const name = mail.from?.name ?? '';
      const m = name.match(/[\w.+-]+@[\w.-]+\.\w+/);
      if (!m || m[0].toLowerCase().endsWith('@' + mail.from!.domain)) return;
      hit(
        {
          en: `The display name "${name}" contains ${m[0]}, but the real address is ${mail.from!.address}.`,
          tr: `Görünen ad "${name}" içinde ${m[0]} var ama gerçek adres ${mail.from!.address}.`,
        },
        [`From: ${name} <${mail.from!.address}>`],
      );
    },
  ),
  defineRule(
    {
      id: 'H08', layer: 'headers', severity: 'high', weight: 14,
      title: { en: 'Display name impersonates a brand', tr: 'Görünen ad bir markayı taklit ediyor' },
      why: {
        en: 'When the display name is a well-known company but the address is a free mailbox or an unrelated domain, the name is there only to borrow trust.',
        tr: 'Görünen ad bilinen bir kurum adıyken gerçek adres ücretsiz bir posta sağlayıcısı ya da ilgisiz bir alan adıysa, kurum adı yalnızca güven kazanmak için kullanılmıştır.',
      },
    },
    ({ mail }, hit) => {
      const from = mail.from;
      if (!from) return;
      for (const brand of brandsInText(from.name)) {
        const official = brand.domains.some((d) => from.registrable === d || from.domain.endsWith('.' + d));
        if (official) continue;
        const free = freeMailDomains.has(from.registrable);
        hit(
          {
            en: `The display name "${from.name}" mentions ${brand.name}, but the mail comes from ${free ? 'a free mailbox' : from.domain}.`,
            tr: `Görünen ad "${from.name}" ${brand.name} markasını anıyor, gerçek gönderen ise ${free ? 'ücretsiz bir posta hesabı' : `${from.domain} alan adı`}.`,
          },
          [`From: ${from.name} <${from.address}>`],
        );
        return;
      }
    },
  ),
  defineRule(
    {
      id: 'H09', layer: 'headers', severity: 'medium', weight: 8,
      title: { en: 'DKIM domain is not aligned with the sender', tr: 'DKIM imza alanı gönderenle hizalı değil' },
      why: {
        en: 'Even a valid signature does not help if it belongs to another domain, because DMARC alignment fails. Bulk senders do this, but bank notices should not.',
        tr: 'İmza geçerli olsa bile başka bir alan adına aitse, DMARC hizalaması sağlanmaz. Toplu gönderim servisleri bunu yapar ama kurumsal bankacılık postalarında beklenmez.',
      },
    },
    ({ mail }, hit) => {
      const f = mail.from?.registrable;
      if (!f || !mail.dkimDomains.length) return;
      if (mail.dkimDomains.some((d) => d === f || d.endsWith('.' + f))) return;
      const list = mail.dkimDomains.join(', ');
      hit({ en: `Signing domain: ${list}; sender: ${f}.`, tr: `İmza alan adı: ${list}; gönderen: ${f}.` }, mail.headers['dkim-signature']?.slice(0, 2));
    },
  ),
  defineRule(
    {
      id: 'H10', layer: 'headers', severity: 'low', weight: 5,
      title: { en: 'Message-ID does not match the sender domain', tr: 'Message-ID gönderen alan adıyla uyuşmuyor' },
      why: {
        en: 'Message-ID is normally generated with the sending server\'s domain. A mismatch suggests the mail was sent from somewhere else with a template. On its own it is a weak signal.',
        tr: 'Message-ID normalde gönderen sunucunun alan adıyla üretilir. Uyuşmazlık, postanın bir şablonla başka yerden gönderildiğini düşündürür; tek başına zayıf bir işarettir.',
      },
    },
    ({ mail }, hit) => {
      const f = mail.from?.registrable;
      const id = mail.messageId?.match(/@([^>]+)>?$/)?.[1]?.toLowerCase();
      if (!f || !id || id.endsWith(f) || freeMailDomains.has(f)) return;
      hit({ en: `Message-ID domain: ${id}; sender: ${f}.`, tr: `Message-ID alan adı: ${id}; gönderen: ${f}.` }, [`Message-ID: ${mail.messageId}`]);
    },
  ),
  defineRule(
    {
      id: 'H11', layer: 'headers', severity: 'low', weight: 5,
      title: { en: 'Message-ID is missing', tr: 'Message-ID yok' },
      why: {
        en: 'Every proper mail server adds a Message-ID. A missing one points to a crude sending script.',
        tr: 'Her düzgün posta sunucusu Message-ID ekler. Yokluğu amatör bir gönderim aracına işaret eder.',
      },
    },
    ({ mail }, hit) => {
      if (!mail.hasHeaders || mail.messageId) return;
      hit({ en: 'There is no Message-ID header.', tr: 'Başlıklarda Message-ID bulunmuyor.' });
    },
  ),
  defineRule(
    {
      id: 'H12', layer: 'headers', severity: 'low', weight: 4,
      title: { en: 'First hop is a private network address', tr: 'İlk sunucu adımı özel ağ adresinden' },
      why: {
        en: 'The bottom Received line is the machine the mail started on. A private IP there suggests a compromised PC or a home network.',
        tr: 'Received zincirinin en altındaki (ilk) adım, postanın doğduğu makinedir. Özel bir IP, ele geçirilmiş bir bilgisayardan ya da ev ağından gönderimi düşündürür.',
      },
    },
    ({ mail }, hit) => {
      const first = mail.hops[mail.hops.length - 1];
      if (!first?.ip || !privateIp.test(first.ip) || mail.hops.length < 2) return;
      hit({ en: `First hop IP: ${first.ip}.`, tr: `İlk adım IP: ${first.ip}.` }, [first.raw]);
    },
  ),
  defineRule(
    {
      id: 'H13', layer: 'headers', severity: 'info', weight: 0,
      title: { en: 'Analyzed without headers', tr: 'Başlıklar olmadan analiz edildi' },
      why: {
        en: 'Only the body was pasted, so authentication, sender and server chain checks could not run. The score is based on partial data.',
        tr: 'Yalnızca gövde metni yapıştırıldı. Kimlik doğrulama, gönderen ve sunucu zinciri kontrolleri yapılamadı; puan eksik veriye dayanıyor.',
      },
    },
    ({ mail }, hit) => {
      if (mail.hasHeaders) return;
      hit({
        en: 'The source has no header lines like From or Received. For a full check, copy the original message ("show original" or "view source").',
        tr: 'Kaynak metinde From/Received gibi başlık satırları yok. Tam analiz için postayı "orijinali göster" ya da "kaynağı görüntüle" ile alın.',
      });
    },
  ),
];
