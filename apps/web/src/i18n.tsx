import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Locale, Severity, Text, Verdict } from '@kanca/engine/browser';

const en = {
  meta: {
    title: 'Kanca: see why an email is phishing',
    description: 'Paste a suspicious email and see, line by line, why it looks like phishing. Runs entirely in your browser.',
  },
  nav: { analyze: 'Analyze', method: 'Method', about: 'About', source: 'Source code', menu: 'Main menu', home: 'Kanca home' },
  theme: { toDark: 'Switch to dark theme', toLight: 'Switch to light theme' },
  lang: { label: 'Language', other: 'Türkçe', otherCode: 'TR' },
  skip: 'Skip to content',
  footer: {
    privacy: 'Your email never leaves your browser. The analysis runs on this page.',
    license: 'Open source, MIT license',
    rules: 'Rules and scoring',
  },
  home: {
    title: 'Is this email really from your bank?',
    lede: (n: number) =>
      `Paste the raw source of a suspicious email. Kanca checks headers, domains, links and attachments against ${n} rules and marks every finding right on the source.`,
    sourceLabel: 'Email source',
    placeholder:
      'Return-Path: <...>\nReceived: from ...\nAuthentication-Results: ...\nFrom: "..." <...>\nSubject: ...\n\nPaste the full source with headers here, or drop an .eml file.',
    empty: 'Empty',
    lines: (n: number) => `${n} lines`,
    chooseFile: 'Choose file',
    clear: 'Clear',
    analyze: 'Analyze',
    analyzing: 'Analyzing',
    errEmpty: 'Paste the email source first, or drop an .eml file.',
    errParse: 'The email could not be read. Make sure you pasted the whole source, including headers.',
    errSize: 'The file is larger than 10 MB.',
    errMsg: '.msg is an Outlook-only binary format. Save the message as .eml from Outlook, or copy its source.',
    dns: 'Also look up the sender domain\'s DNS records',
    dnsNote: 'For SPF, DMARC and MX checks only the domain name is sent to the server.',
    samples: 'Try a sample:',
    guideTitle: 'Where do I find the source?',
    guideText:
      'If you copy only the body, the sending server and authentication results are lost. Use the original source of the message for the most accurate result.',
    clients: [
      { name: 'Gmail', how: 'Open the message, click the three dots at the top right, choose "Show original", then "Copy to clipboard".' },
      { name: 'Outlook', how: 'Open the message, then in the three-dot menu choose "View" and "View message source".' },
      { name: 'Apple Mail', how: 'Select the message, then View, Message, "Raw Source".' },
      { name: 'Thunderbird', how: 'Select the message and press Ctrl+U.' },
    ],
    promise: [
      { title: 'Closed circuit', text: 'The engine runs inside this page. The email, its attachments and its links are never sent anywhere, and links are never opened.' },
      { title: 'Explainable', text: 'The score comes from open rules, not an AI guess. Every finding shows its evidence, its weight and why it matters.' },
      { title: 'Repeatable', text: 'The same email always gets the same score. You can read every rule in the source code.' },
    ],
  },
  samples: {
    bank: 'Fake bank notice (TR)',
    paypal: 'PayPal account limited',
    cargo: 'Courier attachment (TR)',
    account: 'Microsoft sign-in alert',
    text: 'Body only',
    newsletter: 'A real newsletter',
  },
  verdict: {
    title: {
      high: 'High risk. This email shows signs of phishing.',
      medium: 'Suspicious. Verify the sender through another channel.',
      low: 'No clear signs of phishing found.',
    } as Record<Verdict, string>,
    advice: {
      high: 'Do not click the links, do not open attachments, do not reply. Call the company on a number you already know.',
      medium: 'Type the address into your browser yourself instead of clicking. If a password or code is asked for, do not give it.',
      low: 'This does not prove the email is safe. It only means none of the known phishing signs were found.',
    } as Record<Verdict, string>,
    summary: (findings: number, layers: number) => `${findings} ${findings === 1 ? 'finding' : 'findings'} across ${layers} ${layers === 1 ? 'layer' : 'layers'}.`,
    none: 'No scoring findings.',
    scoreLabel: (n: number) => `Risk score ${n} out of 100`,
    subject: 'Subject',
    displayName: 'Display name',
    from: 'From',
    replyTo: 'Reply-To',
    returnPath: 'Return path',
    date: 'Date',
    missing: 'none',
  },
  layers: { label: 'Score by layer', skipped: 'skipped', clean: 'clean', findings: (n: number) => `${n} ${n === 1 ? 'finding' : 'findings'}` },
  severity: { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low', info: 'Info' } as Record<Severity, string>,
  findings: {
    emptyTitle: 'No findings',
    emptyText: 'No rule was triggered. Still, if you did not expect this email, verify the sender before clicking anything.',
    marked: 'Marked in the source',
    meta: (layer: string, severity: string, weight: number) => `${layer} layer, ${severity.toLowerCase()} severity, weight ${weight}`,
    group: (name: string) => `${name} severity`,
  },
  source: {
    title: 'Marked source',
    clear: 'Clear selection',
    unavailableTitle: 'Source not available',
    unavailableText: 'The email was too large to keep in this tab, so the marked source could not be stored.',
  },
  report: {
    newAnalysis: 'New analysis',
    missingTitle: 'No report to show',
    missingText: 'Nothing has been analyzed in this tab yet, or the tab was reopened.',
    start: 'Start a new analysis',
    hops: 'Server chain',
    hopsLede: 'The servers the email passed through, from the machine it started on to your inbox.',
    unknown: 'unknown',
    via: 'via',
    privateNet: 'private network',
    links: 'Links',
    linksLede: 'None of the links were opened. The text you see and the real destination, side by side.',
    shown: 'Shown',
    target: 'Real destination',
    flags: 'Flags',
    attachments: 'Attachments',
    attachmentsLede: 'Attachments were not opened or run. Only their name, type and size were checked.',
    file: 'File',
    type: 'Type',
    size: 'Size',
    skipped: 'Skipped checks',
    foot: (version: string, date: string, dns: boolean) => `Engine ${version}, ${date}, ${dns ? 'with DNS lookup' : 'offline'}.`,
    howScored: 'How is the score calculated?',
  },
  linkFlags: {
    'ip-host': 'IP address',
    userinfo: '@ trick',
    punycode: 'punycode',
    shortener: 'shortener',
    'no-tls': 'no https',
    'script-scheme': 'script',
    long: 'very long',
    encoded: 'encoded',
    'deep-subdomain': 'deep subdomain',
    'odd-port': 'odd port',
  } as Record<string, string>,
  attachmentFlags: {
    executable: 'executable',
    macro: 'macro',
    archive: 'archive',
    web: 'HTML',
    'double-extension': 'double extension',
    'padded-name': 'padded name',
    qr: 'may be QR',
  } as Record<string, string>,
  method: {
    title: 'Rules and scoring',
    lede: 'Kanca is not a classifier. It is an open rule engine. Every rule has a weight, a layer and a short note on why it matters, and the same email always gets the same result.',
    scoringTitle: 'How the score is calculated',
    steps: (medium: number, high: number) => [
      'Each triggered rule adds its weight. If the same rule matches more than once, every extra match adds a quarter of its weight.',
      'Each layer has a cap. No single layer can go past it, however many findings it has, so an email cannot reach high risk on text patterns alone.',
      'If at least three different layers have findings, 5 points are added. Independent signs together mean more than one strong sign.',
      `The total is capped at 100. ${medium} and above is suspicious, ${high} and above is high risk.`,
    ],
    cap: (n: number) => `up to ${n}`,
    code: 'Code',
    rule: 'Rule',
    severity: 'Severity',
    weight: 'Weight',
    intro: {
      headers: 'Authentication results written by the receiving server, consistency of the sender, reply and return addresses, and the server chain.',
      dns: 'Optional. MX, SPF and DMARC records of the sender domain. Only the domain name is sent to the server.',
      domain: 'How close the sender domain is to known brands, subdomain tricks, punycode and risky extensions.',
      links: 'Shown text versus real target, lookalike domains, IP and shortened links, and forms inside the email.',
      attachments: 'Attachments are never opened. Only the name, extension and type are checked: executables, macros, archives, HTML files.',
      content: 'Turkish and English patterns for urgency, threats, prize promises, requests for passwords and cards, and hidden text.',
    } as Record<string, string>,
    limitsTitle: 'Known limits',
    limits: [
      'Links are not opened, so the final target of shortened links is not resolved.',
      'Attachments are not opened, so archive contents and document macros are not inspected.',
      'Domain age and threat lists are not checked, because the tool runs as a closed circuit.',
      'The brand list covers commonly impersonated companies in Turkey, Europe and the US. It is not complete.',
      'A low score does not prove the email is safe.',
    ],
  },
  about: {
    title: 'About Kanca',
    lede: 'Kanca means "hook" in Turkish. Phishing is about the hook; this tool shows you where it is.',
    sections: [
      {
        title: 'Why I built it',
        body: [
          'Most people get at least one fake bank, courier or account email a month. Spam filters catch many of them, but the ones that get through look convincing, and "be careful" is not much help.',
          'I wanted something that explains instead of just saying "dangerous": which line of the email gives it away, and why it matters. Kanca reads the same things a security analyst would look at and puts them on the screen in plain language.',
        ],
      },
      {
        title: 'Open source',
        body: [
          'All of Kanca\'s code is public under the MIT license. You can read every rule, run it on your own machine, or use it in your own project.',
          'If you find a missed phishing email or a false alarm, opening an issue on GitHub helps a lot. Adding a new brand or rule is usually a few lines of code.',
        ],
      },
      {
        title: 'Your email stays with you',
        body: [
          'The analysis engine runs in your browser. The email you paste, its attachments and links are not sent to any server. No account, no cookies, no tracking.',
          'If you turn on the DNS check, only the sender\'s domain name, for example example.com, goes to the server. The result is not stored.',
        ],
      },
      {
        title: 'How it works',
        body: [
          'The email is split into its parts: headers, sender addresses, the server chain, body, links and attachments. Then 50 rules in six layers run on those parts.',
          'Each rule has a weight. The score is the sum of the triggered rules, limited per layer. The details are on the method page.',
        ],
      },
    ],
    stackTitle: 'Built with',
    stack: ['TypeScript', 'React and Vite', 'postal-mime for MIME parsing', 'tldts for domain parsing', 'Hono for the small DNS endpoint', 'Vitest'],
    contributeTitle: 'Contributing',
    contribute: 'Issues and pull requests are welcome. Samples of real phishing emails are especially useful; remove your own address and name before sharing.',
    repo: 'View on GitHub',
    method: 'Read the rules',
    disclaimer: 'Kanca is a helper, not a guarantee. When in doubt, contact the company through a channel you already trust.',
  },
};

type Dict = typeof en;

const tr: Dict = {
  meta: {
    title: 'Kanca: bir e-postanın neden oltalama olduğunu gör',
    description: 'Şüpheli bir e-postayı yapıştırın, neden oltalama gibi göründüğünü satır satır görün. Tamamen tarayıcınızda çalışır.',
  },
  nav: { analyze: 'Analiz', method: 'Yöntem', about: 'Hakkında', source: 'Kaynak kodu', menu: 'Ana menü', home: 'Kanca ana sayfa' },
  theme: { toDark: 'Koyu temaya geç', toLight: 'Açık temaya geç' },
  lang: { label: 'Dil', other: 'English', otherCode: 'EN' },
  skip: 'İçeriğe geç',
  footer: {
    privacy: 'E-postanız tarayıcınızdan çıkmaz. Analiz bu sayfanın içinde çalışır.',
    license: 'Açık kaynak, MIT lisansı',
    rules: 'Kurallar ve puanlama',
  },
  home: {
    title: 'Bu e-posta gerçekten bankanızdan mı?',
    lede: (n: number) =>
      `Şüpheli postanın ham kaynağını yapıştırın. Kanca başlıkları, alan adlarını, bağlantıları ve ekleri ${n} kuralla inceler, her bulguyu kaynağın üstünde işaretler.`,
    sourceLabel: 'E-posta kaynağı',
    placeholder:
      'Return-Path: <...>\nReceived: from ...\nAuthentication-Results: ...\nFrom: "..." <...>\nSubject: ...\n\nKaynağı başlıklarıyla birlikte buraya yapıştırın ya da .eml dosyasını bırakın.',
    empty: 'Boş',
    lines: (n: number) => `${n} satır`,
    chooseFile: 'Dosya seç',
    clear: 'Temizle',
    analyze: 'İncele',
    analyzing: 'İnceleniyor',
    errEmpty: 'Önce e-postanın kaynağını yapıştırın ya da bir .eml dosyası bırakın.',
    errParse: 'E-posta okunamadı. Kaynağın tamamını, başlıklarla birlikte yapıştırdığınızdan emin olun.',
    errSize: 'Dosya 10 MB sınırını aşıyor.',
    errMsg: '.msg dosyaları Outlook\'a özel ikili biçimdir. Outlook\'ta .eml olarak kaydedin ya da kaynağı kopyalayın.',
    dns: 'Gönderen alan adının DNS kayıtlarını da sorgula',
    dnsNote: 'SPF, DMARC ve MX kayıtları için sunucuya yalnızca alan adı gönderilir.',
    samples: 'Örnekle deneyin:',
    guideTitle: 'Kaynağı nereden alırım?',
    guideText:
      'Yalnızca gövdeyi kopyalarsanız gönderen sunucu ve kimlik doğrulama sonuçları görünmez. En doğru sonuç için postanın orijinal kaynağını kullanın.',
    clients: [
      { name: 'Gmail', how: 'Postayı açın, sağ üstteki üç noktaya basın, "Orijinali göster"i seçin, "Panoya kopyala" deyin.' },
      { name: 'Outlook', how: 'Postayı açın, üç nokta menüsünden "Görüntüle" ve "İleti kaynağını görüntüle"yi seçin.' },
      { name: 'Apple Mail', how: 'Postayı seçin, menüden Görüntüle, İleti, "Ham Kaynak"ı açın.' },
      { name: 'Thunderbird', how: 'Postayı seçip Ctrl+U ile kaynağı açın.' },
    ],
    promise: [
      { title: 'Kapalı devre', text: 'Analiz motoru bu sayfanın içinde çalışır. E-posta, ekleri ve bağlantıları hiçbir sunucuya gönderilmez, bağlantılar açılmaz.' },
      { title: 'Açıklanabilir', text: 'Puanı bir yapay zekâ tahmini değil, açık kurallar belirler. Her bulgu kanıtı, ağırlığı ve neden önemli olduğuyla gösterilir.' },
      { title: 'Tekrarlanabilir', text: 'Aynı e-posta her seferinde aynı puanı alır. Her kuralı kaynak kodda okuyabilirsiniz.' },
    ],
  },
  samples: {
    bank: 'Sahte banka bildirimi',
    paypal: 'PayPal hesap kısıtlaması (EN)',
    cargo: 'Kargo eki',
    account: 'Microsoft giriş uyarısı (EN)',
    text: 'Yalnızca metin',
    newsletter: 'Gerçek bir bülten',
  },
  verdict: {
    title: {
      high: 'Yüksek risk. Bu e-posta oltalama işaretleri taşıyor.',
      medium: 'Şüpheli. Göndereni başka bir kanaldan doğrulayın.',
      low: 'Belirgin bir oltalama işareti bulunmadı.',
    },
    advice: {
      high: 'Bağlantılara tıklamayın, ekleri açmayın, yanıt vermeyin. Kurumu kendi bildiğiniz numaradan arayın.',
      medium: 'Bağlantıya tıklamak yerine adresi tarayıcıya kendiniz yazın. Şifre ya da kod istendiyse vermeyin.',
      low: 'Bu, e-postanın güvenli olduğunun kanıtı değildir. Yalnızca bilinen oltalama işaretlerinin bulunmadığını gösterir.',
    },
    summary: (findings: number, layers: number) => `${findings} bulgu, ${layers} katmanda.`,
    none: 'Puan getiren bulgu yok.',
    scoreLabel: (n: number) => `Risk puanı ${n} / 100`,
    subject: 'Konu',
    displayName: 'Görünen ad',
    from: 'Gönderen',
    replyTo: 'Yanıt adresi',
    returnPath: 'Dönüş yolu',
    date: 'Tarih',
    missing: 'yok',
  },
  layers: { label: 'Katmanlara göre puan', skipped: 'atlandı', clean: 'temiz', findings: (n: number) => `${n} bulgu` },
  severity: { critical: 'Kritik', high: 'Yüksek', medium: 'Orta', low: 'Düşük', info: 'Bilgi' },
  findings: {
    emptyTitle: 'Bulgu yok',
    emptyText: 'Hiçbir kural tetiklenmedi. Yine de beklemediğiniz bir postada bağlantıya tıklamadan önce göndereni doğrulayın.',
    marked: 'Kaynakta işaretli',
    meta: (layer: string, severity: string, weight: number) => `${layer} katmanı, ${severity.toLocaleLowerCase('tr')} önem, ağırlık ${weight}`,
    group: (name: string) => `${name} önem`,
  },
  source: {
    title: 'İşaretlenmiş kaynak',
    clear: 'Seçimi kaldır',
    unavailableTitle: 'Kaynak gösterilemiyor',
    unavailableText: 'E-posta bu sekmede saklanamayacak kadar büyük olduğu için işaretlenmiş kaynak kaydedilemedi.',
  },
  report: {
    newAnalysis: 'Yeni analiz',
    missingTitle: 'Gösterilecek rapor yok',
    missingText: 'Bu sekmede henüz analiz yapılmadı ya da sekme kapatılıp açıldı.',
    start: 'Yeni analiz başlat',
    hops: 'Sunucu zinciri',
    hopsLede: 'Postanın doğduğu makineden kutunuza kadar geçtiği sunucular, ilk adımdan son adıma.',
    unknown: 'bilinmeyen',
    via: 'üzerinden',
    privateNet: 'özel ağ',
    links: 'Bağlantılar',
    linksLede: 'Bağlantılar açılmadı. Görünen metin ile gerçekte gidilecek adres yan yana.',
    shown: 'Görünen',
    target: 'Gerçek hedef',
    flags: 'İşaretler',
    attachments: 'Ekler',
    attachmentsLede: 'Ekler açılmadı ve çalıştırılmadı. Yalnızca adı, türü ve boyutu incelendi.',
    file: 'Dosya',
    type: 'Tür',
    size: 'Boyut',
    skipped: 'Atlanan kontroller',
    foot: (version: string, date: string, dns: boolean) => `Motor ${version}, ${date}, ${dns ? 'DNS sorgusuyla' : 'çevrimdışı'}.`,
    howScored: 'Puan nasıl hesaplanıyor?',
  },
  linkFlags: {
    'ip-host': 'IP adresi',
    userinfo: '@ hilesi',
    punycode: 'punycode',
    shortener: 'kısaltıcı',
    'no-tls': 'şifresiz',
    'script-scheme': 'betik',
    long: 'çok uzun',
    encoded: 'kodlanmış',
    'deep-subdomain': 'derin alt alan',
    'odd-port': 'farklı port',
  },
  attachmentFlags: {
    executable: 'çalıştırılabilir',
    macro: 'makro',
    archive: 'arşiv',
    web: 'HTML',
    'double-extension': 'çift uzantı',
    'padded-name': 'boşlukla gizlenmiş ad',
    qr: 'QR olabilir',
  },
  method: {
    title: 'Kurallar ve puanlama',
    lede: 'Kanca bir sınıflandırma modeli değil, açık bir kural motorudur. Her kuralın bir ağırlığı, bir katmanı ve neden önemli olduğunu anlatan bir açıklaması vardır. Aynı e-posta her seferinde aynı sonucu verir.',
    scoringTitle: 'Puan nasıl hesaplanır',
    steps: (medium: number, high: number) => [
      'Her kural tetiklendiğinde kendi ağırlığı kadar puan ekler. Aynı kural birden çok kez tetiklenirse sonraki her eşleşme ağırlığın dörtte biri kadar ekler.',
      'Her katmanın bir tavanı vardır. Tek bir katman, ne kadar bulgu olursa olsun tavanını aşamaz; böylece yalnızca metin kalıplarına dayanan bir posta yüksek risk almaz.',
      'En az üç farklı katmanda bulgu varsa toplam puana 5 eklenir. Bağımsız işaretlerin bir araya gelmesi tek bir güçlü işaretten daha anlamlıdır.',
      `Toplam en fazla 100'dür. ${medium} ve üzeri şüpheli, ${high} ve üzeri yüksek risk sayılır.`,
    ],
    cap: (n: number) => `en fazla ${n}`,
    code: 'Kod',
    rule: 'Kural',
    severity: 'Önem',
    weight: 'Ağırlık',
    intro: {
      headers: 'Alıcı sunucunun yazdığı kimlik doğrulama sonuçları, gönderen, yanıt ve dönüş adreslerinin tutarlılığı, sunucu zinciri.',
      dns: 'İsteğe bağlı. Gönderen alan adının MX, SPF ve DMARC kayıtları. Sunucuya yalnızca alan adı gider.',
      domain: 'Gönderen alan adının bilinen markalara benzerliği, alt alan adı hileleri, punycode ve riskli uzantılar.',
      links: 'Görünen metin ile gerçek hedef farkı, taklit alan adları, IP adresli ve kısaltılmış bağlantılar, posta içi formlar.',
      attachments: 'Ekler açılmaz. Yalnızca ad, uzantı ve türe bakılır: çalıştırılabilir, makrolu, arşiv, HTML ekler.',
      content: 'Türkçe ve İngilizce kalıplarla aciliyet, tehdit, ödül vaadi, şifre ve kart bilgisi isteme, gizli metin.',
    },
    limitsTitle: 'Bilinen sınırlar',
    limits: [
      'Bağlantılar açılmadığı için kısaltılmış bağlantıların son hedefi çözülmez.',
      'Ekler açılmadığı için arşivlerin içi ve belgelerdeki makrolar incelenmez.',
      'Alan adı yaşı ve tehdit listeleri sorgulanmaz; araç kapalı devre çalışır.',
      'Marka listesi Türkiye, Avrupa ve ABD\'de sık taklit edilen kurumları kapsar, eksiksiz değildir.',
      'Düşük puan, postanın güvenli olduğunu kanıtlamaz.',
    ],
  },
  about: {
    title: 'Kanca hakkında',
    lede: 'Oltalamada her şey kancaya bağlıdır. Bu araç kancanın nerede olduğunu gösteriyor.',
    sections: [
      {
        title: 'Neden yaptım',
        body: [
          'Çoğumuza ayda en az bir sahte banka, kargo ya da hesap maili geliyor. Spam filtreleri bir kısmını yakalıyor ama arada kalanlar inandırıcı ve "dikkatli olun" demek pek işe yaramıyor.',
          'Sadece "tehlikeli" demek yerine açıklayan bir şey istedim: mailin hangi satırı ele veriyor ve bu neden önemli. Kanca, bir güvenlik analistinin bakacağı şeyleri okuyup sade bir dille ekrana koyuyor.',
        ],
      },
      {
        title: 'Açık kaynak',
        body: [
          'Kanca\'nın bütün kodu MIT lisansıyla herkese açık. Her kuralı okuyabilir, kendi bilgisayarınızda çalıştırabilir ya da kendi projenizde kullanabilirsiniz.',
          'Kaçırılan bir oltalama maili ya da yanlış bir alarm görürseniz GitHub\'da issue açmanız çok işe yarar. Yeni bir marka ya da kural eklemek genelde birkaç satırlık iştir.',
        ],
      },
      {
        title: 'Mailiniz sizde kalır',
        body: [
          'Analiz motoru tarayıcınızda çalışır. Yapıştırdığınız mail, ekleri ve bağlantıları hiçbir sunucuya gönderilmez. Hesap yok, çerez yok, takip yok.',
          'DNS kontrolünü açarsanız sunucuya yalnızca gönderenin alan adı gider, örneğin ornek.com. Sonuç saklanmaz.',
        ],
      },
      {
        title: 'Nasıl çalışıyor',
        body: [
          'Mail parçalarına ayrılır: başlıklar, gönderen adresleri, sunucu zinciri, gövde, bağlantılar ve ekler. Sonra altı katmandaki 50 kural bu parçalar üzerinde çalışır.',
          'Her kuralın bir ağırlığı var. Puan, tetiklenen kuralların katman tavanlarıyla sınırlanmış toplamıdır. Ayrıntılar yöntem sayfasında.',
        ],
      },
    ],
    stackTitle: 'Kullanılanlar',
    stack: ['TypeScript', 'React ve Vite', 'MIME ayrıştırma için postal-mime', 'Alan adı ayrıştırma için tldts', 'Küçük DNS ucu için Hono', 'Vitest'],
    contributeTitle: 'Katkı',
    contribute: 'Issue ve pull request\'ler açık. Gerçek oltalama maili örnekleri özellikle değerli; paylaşmadan önce kendi adresinizi ve adınızı silin.',
    repo: 'GitHub\'da incele',
    method: 'Kuralları oku',
    disclaimer: 'Kanca bir yardımcıdır, garanti değildir. Emin olamadığınızda kuruma zaten güvendiğiniz bir kanaldan ulaşın.',
  },
};

const dictionaries: Record<Locale, Dict> = { en, tr };

const storageKey = 'kanca-lang';

function initialLocale(): Locale {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === 'en' || saved === 'tr') return saved;
  } catch {}
  const langs = typeof navigator !== 'undefined' ? navigator.languages ?? [navigator.language] : [];
  return langs.some((l) => l?.toLowerCase().startsWith('tr')) ? 'tr' : 'en';
}

interface I18n {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dict;
  l: (text: Text) => string;
}

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = dictionaries[locale].meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', dictionaries[locale].meta.description);
  }, [locale]);

  const value = useMemo<I18n>(
    () => ({
      locale,
      setLocale: (l) => {
        setLocaleState(l);
        try {
          localStorage.setItem(storageKey, l);
        } catch {}
      },
      t: dictionaries[locale],
      l: (text) => text[locale],
    }),
    [locale],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('I18nProvider missing');
  return ctx;
}
