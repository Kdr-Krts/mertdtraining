# Mert Duman

Statik kişisel koç sitesi (Eleventy).

## Geliştirme

```bash
npm install
npm run dev
```

Site: http://localhost:5188

## Build

```bash
npm run build
```

Çıktı: `dist/`

## Yapı

- `src/` — kaynak (şablonlar, CSS, JS)
- `src/_layouts/` — ortak layout
- `src/_includes/` — header, footer, sepet
- `src/_data/site.json` — site URL, e-posta, sosyal linkler
- `src/_data/products.json` — paketler
- `src/_data/faq.json` — SSS
- `src/_headers` — Netlify / Cloudflare Pages cache kuralları
- `assets/img/` — orijinal görseller
- `scripts/optimize-images.mjs` — WebP + srcset boyutları
- `scripts/copy-fonts.mjs` — self-host font dosyaları

CSS/JS build’de içerik hash’i alır (`styles.abc123.css`). Hosting: Netlify (`netlify.toml` + `_headers`), Vercel (`vercel.json`) veya Cloudflare Pages (`_headers`).

## Site ayarları

`src/_data/site.json` içinde:

- `url` — canlı domain (canonical, OG, sitemap)
- `email` — iletişim formu (FormSubmit) ve mailto
- `whatsapp` — ülke kodlu numara, örn. `905551234567` (boş/`null` ise buton gizlenir)
- `socials` — yalnızca gerçek URL’ler ekle; boş bırakma / `#` kullanma

Paketler: `src/_data/products.json` (HTML’de SSR + sepet JS)

İletişim formu [FormSubmit](https://formsubmit.co) kullanır. İlk gönderimde `email` adresine onay maili gider; onaydan sonra mesajlar iletilir.
