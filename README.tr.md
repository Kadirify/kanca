# Kanca

Şüpheli bir maili yapıştır, neden oltalama olduğunu gör.

Kanca bir e-postanın ham kaynağını bir güvenlik uzmanı gibi okur: gerçekte kim göndermiş, hangi sunucudan geçmiş, bağlantılar aslında nereye gidiyor, ekler ne. Sonra ele veren kısımları kaynağın üstünde işaretler ve her birinin neden önemli olduğunu kısaca yazar.

Tamamen tarayıcıda çalışır. Yapıştırdığın mail hiçbir yere yüklenmez.

**Dene:** [kanca.kadirify.com](https://kanca.kadirify.com/)

[English](README.md)

![Kanca rapor ekranı](docs/img/ekran-goruntusu.jpg)

## Neden

Oltalamayla ilgili tavsiyelerin çoğu "dikkatli olun"a çıkıyor. Mail bankanınkinin aynısı gibi görünüyorsa bunun pek faydası yok. Ben doğrudan satırı gösteren bir şey istedim: sorun bu, nedeni de bu.

İçinde yapay zekâ modeli yok. Puanı, herkesin [`packages/engine/src/rules`](packages/engine/src/rules) altında okuyabileceği 50 basit kural veriyor. Aynı mail her seferinde aynı sonucu alır.

## Neye bakıyor

- **Başlıklar:** SPF, DKIM ve DMARC sonuçları, From, Return-Path ve Reply-To tutarlılığı, görünen ad hileleri, sunucu zinciri.
- **Alan adı:** Sık taklit edilen yaklaşık 80 markanın benzerleri (bankalar, kargo, büyük teknoloji şirketleri, kamu), alt alan adına konmuş marka adları, punycode, ucuz uzantılar.
- **Bağlantılar:** Bir adres gösterip başka yere giden metinler, IP adresli bağlantılar, kısaltıcılar, `kullanici@adres` hilesi, mail içindeki formlar.
- **Ekler:** Çalıştırılabilir dosyalar, çift uzantılar, makrolu Office dosyaları, arşivler, HTML ekler. Hiçbiri açılmaz.
- **İçerik:** Aciliyet, tehdit, ödül ve iade yemi, şifre ya da kart bilgisi isteme, gizli metin. Şimdilik Türkçe ve İngilizce.
- **DNS (isteğe bağlı):** Gönderen alan adının MX, SPF ve DMARC kayıtları. Sunucuya yalnızca alan adı gider.

Her kuralın bir ağırlığı, her katmanın da bir tavanı var. Böylece bir yığın zayıf metin sinyali tek başına bir maili "yüksek risk"e taşıyamaz. Puanlamanın tamamı sitedeki yöntem sayfasında ve [docs/architecture.md](docs/architecture.md) dosyasında.

## Yerelde çalıştırma

Node 20+ ve pnpm gerekiyor.

```bash
pnpm install
pnpm --filter @kanca/engine build
pnpm --filter @kanca/api dev   # localhost:3010, sadece DNS kontrolü için
pnpm --filter @kanca/web dev   # localhost:5180
```

Komut satırından da çalışıyor:

```bash
pnpm analyze samples/banka-oltalama.eml --lang tr
```

Testler için `pnpm test`.

## Sınırlar

Kanca bağlantıları açmaz, bu yüzden kısaltılmış bir bağlantının nereye çıktığını söyleyemez. Ekleri de açmaz, zip'in içini görmez. Alan adı yaşına ve kara listelere bakmaz, çünkü bunlar veriyi üçüncü taraflara göndermeyi gerektirir. Düşük puan, mailin güvenli olduğu anlamına gelmez.

## Katkı

Bariz bir oltalama mailini kaçırdıysa ya da gerçek bir maili işaretlediyse issue açman çok işe yarar. Örnek mail eklersen önce kendi adını ve adresini sil. Yeni bir marka eklemek [`packages/engine/src/domain.ts`](packages/engine/src/domain.ts) içinde tek satır.

## Lisans

MIT
