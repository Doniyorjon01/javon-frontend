# javon-frontend

javon.uz platformasining frontend qismi: platforma sayti, do'kon egasining admin paneli,
do'kon vitrinasi (sayt va Telegram Mini App) va platforma admini. Backend — alohida
[javon](https://github.com/Doniyorjon01/javon) loyihasi (FastAPI).

Stack: Next.js 16 (App Router), React 19, TypeScript. Qo'shimcha UI kutubxonasi yo'q:
dizayn tizimi `app/globals.css` da (javon.uz dizayn kanvasidagi ranglar, shriftlar va hover'lar).

## Lokal ishga tushirish

Kerak: Node.js 20+ (22 tavsiya), ishlab turgan backend (`docker compose up -d` javon papkasida).

```bash
npm install
npm run dev            # http://localhost:3000
```

`.env.local` tayyor turibdi (lokal qiymatlar bilan). Backend'ning `.env` faylida shular bo'lsin:

```env
ENV=local
DEBUG=true                                          # lokal kirish formasi uchun
CORS_ORIGINS=["http://localhost:3000"]
APP_URL=http://localhost:3000                       # xodim taklifi havolalari
STOREFRONT_URL_TEMPLATE=http://localhost:3000/s/{slug}/   # QR kodlar
```

Backend `.env` ni o'zgartirgandan keyin: `docker compose up -d backend worker`.

**Kirish:** lokalda Telegram Login Widget ishlamaydi (Telegram faqat `/setdomain` qilingan
https domenni qabul qiladi), shuning uchun `/kirish` sahifasida «Lokal kirish» formasi chiqadi:
istalgan Telegram ID va ism bilan kirasiz.

**Platforma admini:** foydalanuvchini admin qilish (bir marta):

```bash
docker compose exec postgres psql -U postgres -d javon \
  -c "update users set is_platform_admin = true where telegram_id = <ID>"
```

**Do'kon sayti lokalda** ikki xil ochiladi:
`http://localhost:3000/s/varaq` yoki subdomen bilan `http://varaq.localhost:3000` (Chrome va Firefox'da ishlaydi).

## Sahifalar

| Manzil | Nima |
| --- | --- |
| `/` | Platforma sayti: imkoniyatlar, tariflar (`/plans` dan), savollar |
| `/kirish` | Telegram orqali kirish (lokalda — dev forma) |
| `/admin` | Do'konlarim, `/admin/yangi` — do'kon yaratish (manzil bandligi tekshiriladi) |
| `/admin/{id}` | Bosh sahifa: yangi buyurtmalar, javon, tezkor amallar |
| `/admin/{id}/setup` | Sozlash ustasi: logo → ko'rinish (jonli ko'rinish) → aloqa → kitoblar → yetkazish/to'lov → bot → ishga tushirish |
| `/admin/{id}/orders` | Buyurtmalar: holat tablari, qidiruv, har 20 s yangilanadi; tafsilot, holat o'zgartirish, kartaga to'lov chekini tasdiqlash/rad etish |
| `/admin/{id}/books` | Javon: narx, qoldiq (+/−, nisbiy), saytda ko'rsatish, QR, o'chirish |
| `/admin/{id}/books/add` | Katalogdan qidirish, shtrix-kod skaneri (kamera), ISBN, yangi kitob (moderatsiyaga) |
| `/admin/{id}/books/import` | Excel shablon, yuklash, jarayon va xatolar hisoboti |
| `/admin/{id}/books/submissions` | Moderatsiyadagi / rad etilgan kitoblar |
| `/admin/{id}/qr` | Do'kon QR (SVG/PNG), A4 poster, kitob yorliqlari PDF |
| `/admin/{id}/stats` | Statistika (7/30/90 kun) |
| `/admin/{id}/settings` | Do'kon, ko'rinish, aloqa va ish vaqti, yetkazish, to'lov |
| `/admin/{id}/telegram` | Do'kon botini ulash, xodimlar guruhi, sinov xabari |
| `/admin/{id}/staff` | Xodimlar, taklif havolalari |
| `/admin/{id}/subscription` | Obuna holati, tariflar, to'lov rekvizitlari, tarix |
| `/taklif/{token}` | Xodim taklifini qabul qilish |
| `/system/...` | Platforma admini: ko'rsatkichlar, kitob moderatsiyasi, do'konlar (to'xtatish, to'lov yozish, bekor qilish), foydalanuvchilar, fon vazifalari |
| `/s/{slug}` yoki `{slug}.javon.uz` | Vitrina: katalog, filtrlar, qidiruv |
| `.../kitob/{id}` | Kitob sahifasi (SEO: meta, Open Graph, schema.org Book) — QR kodlar shu yerga olib keladi |
| `.../savat` | Savat va buyurtma (naqd / kartaga o'tkazma, olib ketish / yetkazish, lokatsiya) |
| `.../buyurtma/{id}?token=` | Buyurtmani kuzatish, chek rasmini yuborish |
| `.../buyurtmalarim` | Shu qurilmadagi (va Mini App'da Telegram akkauntdagi) buyurtmalar |
| `.../sitemap.xml`, `.../robots.txt` | Har do'konning o'z sitemap'i |

Admin panel URL'lari backend'dagi `ADMIN_PANEL_URL/<store id>/orders/<order id>` havolalariga mos.

## Qanday ishlaydi

- **API ko'prigi.** Brauzer har doim o'z saytidagi `/api/...` ga murojaat qiladi,
  `app/api/[...path]/route.ts` uni `API_URL` ga uzatadi. Sessiya cookie'si birinchi tomon bo'lib qoladi,
  CORS sozlash shart emas. CSRF tekshiruvi backend'da qoladi: brauzerning `Origin` sarlavhasi uzatiladi.
- **Do'kon subdomenlari.** `proxy.ts` `varaq.javon.uz/kitob/12` ni `/s/varaq/kitob/12` ga aylantiradi
  (backend `Host` ga ishonmaydi — slug yo'lda). Do'kon domenidan faqat `/api/storefront/*` ochiq,
  admin API 404 qaytaradi; vitrina so'rovlariga egasining cookie'si qo'shilmaydi.
- **Telegram Mini App.** Do'kon boti Mini App'ni `https://{slug}.javon.uz/` da ochadi. Vitrina
  Telegram bergan `initData` ni sezadi va buyurtmaga `X-Telegram-Init-Data` qo'shadi — buyurtma
  xaridorning Telegram'iga bog'lanadi, «Buyurtmalarim» backend'dan olinadi.
- **Takror buyurtma bo'lmaydi.** Har buyurtma `idempotency_key` bilan yuboriladi: tugma ikki marta
  bosilsa yoki javob yo'qolsa ham bitta buyurtma yaratiladi.
- **Pul.** API tiyinda beradi va oladi; ekranda so'm (`65 000 so'm`). Sanalar Toshkent vaqtida.
- **Tillar.** O'zbek, rus, ingliz (`lib/i18n/`). Til `javon_lang` cookie'sida. Vitrina faqat do'kon
  tanlagan tillarda ko'rinadi. API'ga `Accept-Language` yuboriladi — xato matnlari ham shu tilda.
- **Rollar.** Xodim buyurtmalar va qoldiq bilan ishlaydi; narx, sozlamalar, statistika, bot,
  obuna — faqat egada (backend bilan bir xil). Obuna tugaganda panel «faqat ko'rish» rejimida.
- **Turlar.** `lib/types.ts` backend'ning OpenAPI sxemasidan yasalgan. Backend sxemasi o'zgarsa,
  shu faylni yangilang.

## Serverga chiqarish

Backend `docker-compose.prod.yml` bilan ishlab turgan serverda:

```bash
git clone <javon-frontend repo> && cd javon-frontend
cp .env.example .env
```

`.env` (production):

```env
API_URL=http://backend:8000
APP_URL=https://javon.uz
BASE_DOMAIN=javon.uz
STORE_URL_TEMPLATE=https://{slug}.javon.uz
TELEGRAM_BOT_USERNAME=javon_bot        # platforma boti, @BotFather'da /setdomain javon.uz
DEV_LOGIN=false
SUPPORT_TELEGRAM=javon_support
```

```bash
docker compose up -d --build
```

Frontend backend stekining `javon_default` tarmog'iga `frontend` nomi bilan qo'shiladi, Caddy uni
o'zi topadi (`FRONTEND_UPSTREAM` standarti `frontend:3000`). Shundan keyin `javon.uz` va
`*.javon.uz` 502 o'rniga saytni ko'rsatadi. Yangilash: `git pull && docker compose up -d --build`.

Backend production `.env` da `CORS_ORIGINS=["https://javon.uz"]` va `SESSION_COOKIE_DOMAIN=.javon.uz`
(bular `docker-compose.prod.yml` da allaqachon shunday).

## Tuzilma

```
app/                     sahifalar (App Router)
  page.tsx               platforma sayti
  kirish/ taklif/ admin/ system/
  s/[slug]/              do'kon vitrinasi
  api/[...path]/         backend'ga ko'prik
proxy.ts                 subdomen → /s/{slug}
components/
  admin/                 panel: sessiya, do'kon konteksti, yon panel, formalar, skaner
  shop/                  vitrina: savat, Mini App, kartochkalar, filtrlar
  landing/               platforma sayti bo'laklari
  ui.tsx icons.tsx book-cover.tsx app.tsx
lib/
  api.ts server-api.ts   API klientlari (xato formati: {"detail": {"code", "message"}})
  types.ts               backend sxemalari
  i18n/                  uz.ts (manba), ru.ts, en.ts
  format.ts theme.ts config.ts hooks.ts
```

## Buyruqlar

| Buyruq | Nima qiladi |
| --- | --- |
| `npm run dev` | Ishlab chiqish rejimi (o'zgarishlar darhol ko'rinadi) |
| `npm run build && npm start` | Production build va ishga tushirish |
| `npm run typecheck` | TypeScript tekshiruvi |
