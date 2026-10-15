import { defineRule } from './common.js';
import type { Rule } from '../types.js';

const word = (alts: string) => new RegExp('(?<!\\p{L})(?:' + alts + ')(?!\\p{L})', 'giu');

const urgency = [
  word('acil|acilen|hemen|derhal|son (?:gün|şans|uyarı|saat)|24 saat|48 saat|bugün içinde|süre(?:niz)? dol\\p{L}*|askıya alın\\p{L}*|kapatılacak|iptal edilecek|dondurul\\p{L}*'),
  word('urgent|immediately|within 24 hours|within 48 hours|final (?:notice|warning)|act now|expires? (?:today|soon)|suspended|will be (?:closed|terminated|locked)'),
];

const credentials = [
  word('şifre\\p{L}*|sifre\\p{L}*|parola\\p{L}*|kart numar\\p{L}*|cvv|cvc|son kullanma|tc kimlik|t\\.c\\. kimlik|kimlik numar\\p{L}*|iban|güvenlik kodu\\p{L}*|sms kodu\\p{L}*|sms doğrulama kodu\\p{L}*|doğrulama kodu\\p{L}*|onay kodu\\p{L}*'),
  word('password|passcode|card number|cvv|cvc|expiry|social security|ssn|one[- ]time code|verification code|login credentials'),
];

const verify = [
  word('hesabınızı doğrula\\p{L}*|bilgilerinizi (?:güncelle|doğrula|onayla)\\p{L}*|kimliğinizi doğrula\\p{L}*|doğrulamak için|onaylamak için|giriş yap(?:ın|arak)'),
  word('verify your (?:account|identity|email)|confirm your (?:account|details|identity)|update your (?:account|billing|payment)|re-?activate|click (?:here|the link) to (?:verify|confirm|update)'),
];

const reward = [
  word('kazandınız|hediye çeki|ödül(?:ünüz)?|çekiliş|bedava|ücretsiz (?:telefon|tatil|hediye)|iade(?:niz)? (?:hazır|onaylandı)|para iadesi|bonus'),
  word('you (?:have )?won|congratulations|prize|gift card|free (?:iphone|gift|vacation)|refund (?:is )?(?:ready|approved)|claim your'),
];

const threat = [
  word('yasal işlem|icra|haciz|ceza|dava|polis|savcılık|hesabınız (?:kapatıl|askıya|dondurul|silin)\\p{L}*|erişiminiz (?:engellen|kısıtlan)\\p{L}*|yetkisiz giriş'),
  word('legal action|lawsuit|police|arrest|your account (?:will be|has been) (?:closed|suspended|locked|deleted)|unauthorized (?:access|login|activity)|unusual (?:sign-in|login|activity)'),
];

const genericGreeting = /^(sayın|değerli|sevgili)\s+(müşterimiz|kullanıcı(mız)?|üyemiz|yetkili|alıcı)|^(dear)\s+(customer|user|member|valued|sir|madam|account holder|client)/imu;

function countHits(text: string, patterns: RegExp[]) {
  const found = new Set<string>();
  for (const re of patterns) for (const m of text.matchAll(re)) found.add(m[0].toLowerCase());
  return [...found];
}

const list = (items: string[], n: number) => items.slice(0, n).join(', ');

export const contentRules: Rule[] = [
  defineRule(
    {
      id: 'C01', layer: 'content', severity: 'medium', weight: 10,
      title: { en: 'Pressure to act fast', tr: 'Aciliyet baskısı' },
      why: {
        en: 'Phishing leaves no time to think: deadlines and demands to act now. Real companies do not threaten to close your account within 24 hours.',
        tr: 'Oltalama metinleri düşünmeye fırsat bırakmamak için süre sınırı ve acil eylem talebi kullanır. Gerçek kurumlar 24 saat içinde hesap kapatmakla tehdit etmez.',
      },
    },
    ({ mail }, hit) => {
      const hits = countHits(mail.subject + '\n' + mail.text, urgency);
      if (!hits.length) return;
      hit({ en: `${hits.length} urgency phrases: ${list(hits, 4)}.`, tr: `${hits.length} aciliyet ifadesi: ${list(hits, 4)}.` }, hits.slice(0, 4));
    },
  ),
  defineRule(
    {
      id: 'C02', layer: 'content', severity: 'high', weight: 14,
      title: { en: 'Asks for passwords, card or ID details', tr: 'Şifre, kart ya da kimlik bilgisi isteniyor' },
      why: {
        en: 'No bank or company asks for a password, card number, CVV or SMS code by email. Being asked is a phishing sign by itself.',
        tr: 'Hiçbir banka ya da kurum e-posta yoluyla şifre, kart numarası, CVV ya da SMS kodu istemez. Bu bilgilerin istenmesi tek başına oltalama işaretidir.',
      },
    },
    ({ mail }, hit) => {
      const hits = countHits(mail.text, credentials);
      const asks = countHits(mail.text, verify);
      if (!hits.length || (!asks.length && !mail.links.length && !mail.hasForm)) return;
      hit({ en: `Mentions: ${list(hits, 4)}.`, tr: `Metinde geçen bilgiler: ${list(hits, 4)}.` }, hits.slice(0, 4));
    },
  ),
  defineRule(
    {
      id: 'C03', layer: 'content', severity: 'medium', weight: 8,
      title: { en: 'Click to verify', tr: 'Bağlantıya tıklayarak doğrulama çağrısı' },
      why: {
        en: '"Click here to verify your account" is the standard way to send people to a fake login page.',
        tr: '"Hesabınızı doğrulamak için tıklayın" kalıbı, kullanıcıyı sahte giriş sayfasına götürmenin standart yoludur.',
      },
    },
    ({ mail }, hit) => {
      const hits = countHits(mail.text, verify);
      if (!hits.length || !mail.links.some((l) => l.scheme.startsWith('http'))) return;
      hit({ en: `${list(hits, 3)}.`, tr: `${list(hits, 3)}.` }, hits.slice(0, 3));
    },
  ),
  defineRule(
    {
      id: 'C04', layer: 'content', severity: 'medium', weight: 8,
      title: { en: 'Promise of a prize or refund', tr: 'Ödül ya da iade vaadi' },
      why: {
        en: 'An unexpected win, gift card or refund is the second most common lever for getting people to type in their details.',
        tr: 'Beklenmedik kazanç, hediye çeki ya da iade bildirimi; kullanıcıyı bilgi girmeye ikna etmek için kullanılan ikinci yaygın kaldıraçtır.',
      },
    },
    ({ mail }, hit) => {
      const hits = countHits(mail.subject + '\n' + mail.text, reward);
      if (hits.length) hit({ en: `${list(hits, 3)}.`, tr: `${list(hits, 3)}.` }, hits.slice(0, 3));
    },
  ),
  defineRule(
    {
      id: 'C05', layer: 'content', severity: 'medium', weight: 8,
      title: { en: 'Threats and scare tactics', tr: 'Tehdit ve korkutma' },
      why: {
        en: 'Legal action, account closure or "unauthorized sign-in" are there to stop you from thinking calmly.',
        tr: 'Yasal işlem, hesap kapatma, yetkisiz giriş gibi korkutucu ifadeler, kullanıcının sakin düşünmesini engellemek için kullanılır.',
      },
    },
    ({ mail }, hit) => {
      const hits = countHits(mail.subject + '\n' + mail.text, threat);
      if (hits.length) hit({ en: `${list(hits, 3)}.`, tr: `${list(hits, 3)}.` }, hits.slice(0, 3));
    },
  ),
  defineRule(
    {
      id: 'C06', layer: 'content', severity: 'low', weight: 4,
      title: { en: 'Generic greeting', tr: 'Genel hitap' },
      why: {
        en: 'A company writing to its customer knows your name. "Dear customer" is the mark of a mass-sent template.',
        tr: 'Müşterisine yazan bir kurum adınızı bilir. "Sayın müşterimiz" ya da "Dear customer" toplu gönderilmiş şablon işaretidir.',
      },
    },
    ({ mail }, hit) => {
      const m = mail.text.match(genericGreeting);
      if (!m) return;
      const g = m[0].trim();
      hit({ en: `Starts with "${g}".`, tr: `"${g}" ile başlıyor.` }, [g]);
    },
  ),
  defineRule(
    {
      id: 'C07', layer: 'content', severity: 'low', weight: 4,
      title: { en: 'Shouting caps and exclamation marks', tr: 'Aşırı büyük harf ve ünlem' },
      why: {
        en: 'SHOUTING subject lines and piles of exclamation marks have no place in professional mail. They are there to grab attention and cause panic.',
        tr: 'BAĞIRAN başlıklar ve ünlem yığınları profesyonel iletişimde yer almaz; dikkat çekme ve panik yaratma amaçlıdır.',
      },
    },
    ({ mail }, hit) => {
      const subj = mail.subject;
      const letters = subj.replace(/[^\p{L}]/gu, '');
      const upper = letters.replace(/[^\p{Lu}]/gu, '');
      const exclaims = (subj + mail.text).match(/!/g)?.length ?? 0;
      if (!((letters.length >= 8 && upper.length / letters.length > 0.7) || exclaims >= 4)) return;
      hit({ en: `Subject: "${subj}"; ${exclaims} exclamation marks.`, tr: `Konu: "${subj}"; ünlem sayısı ${exclaims}.` }, [subj]);
    },
  ),
  defineRule(
    {
      id: 'C08', layer: 'content', severity: 'medium', weight: 10,
      title: { en: 'Hidden text', tr: 'Gizlenmiş metin' },
      why: {
        en: 'Invisible text (font-size:0, display:none) is added to fool spam filters. What the filter reads is not what you see.',
        tr: 'Görünmez (font-size:0, display:none) metin, spam filtrelerini kandırmak için eklenir; okuyucunun görmediği içerik filtrenin gördüğü içeriği seyreltir.',
      },
    },
    ({ mail }, hit) => {
      if (mail.hiddenTextChars < 40) return;
      hit({ en: `${mail.hiddenTextChars} characters of hidden text.`, tr: `${mail.hiddenTextChars} karakter gizli metin.` });
    },
  ),
  defineRule(
    {
      id: 'C09', layer: 'content', severity: 'info', weight: 1,
      title: { en: 'Tracking pixel', tr: 'İzleme pikseli' },
      why: {
        en: '1x1 images tell the sender that and when you opened the mail. Common in newsletters; in phishing it confirms the target is active.',
        tr: '1x1 görseller postanın açıldığını ve ne zaman açıldığını gönderene bildirir. Pazarlama postalarında yaygındır; oltalamada hedefin aktif olduğunu doğrulamak için kullanılır.',
      },
    },
    ({ mail }, hit) => {
      if (mail.trackingPixels > 0) hit({ en: `${mail.trackingPixels} tracking pixel(s).`, tr: `${mail.trackingPixels} izleme pikseli.` });
    },
  ),
  defineRule(
    {
      id: 'C10', layer: 'content', severity: 'low', weight: 5,
      title: { en: 'Fake "Re:" in the subject', tr: 'Konu satırı "Re:" ile sahte yanıt görünümü' },
      why: {
        en: 'Re: or Fwd: is added to suggest an earlier conversation, but there is no previous message in the thread.',
        tr: 'Daha önce yazışılmış izlenimi vermek için konuya Re: ya da Fwd: eklenir; oysa zincirde önceki ileti yoktur.',
      },
    },
    ({ mail }, hit) => {
      if (!mail.hasHeaders || !/^(re|fw|fwd|ynt|ilt|aw|wg)\s*:/i.test(mail.subject)) return;
      if (mail.headers['in-reply-to'] || mail.headers['references']) return;
      hit(
        { en: `Subject is "${mail.subject}" but there is no In-Reply-To or References header.`, tr: `Konu "${mail.subject}" ama In-Reply-To/References başlığı yok.` },
        [mail.subject],
      );
    },
  ),
];
