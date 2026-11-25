# ISF CRM

amoCRM'ga o'xshash universal CRM: bir nechta biznes uchun voronkalar, mijozlar, vazifalar, hisobotlar,
Instagram Direct va telefon (virtual ATS) integratsiyasi.

## Tuzilishi

- `index.html`, `styles.css`, `app.js` — brauzer ilovasi (GitHub Pages orqali ochiladi).
- `config.js` — Supabase manzili va ochiq (publishable) kalit. Ma'lumotlar xavfsizligini bazadagi RLS qoidalari ta'minlaydi.
- Backend — Supabase loyihasi **ISF CRM** (`uppbdpwsxhcjqqgsnzgv`):
  - jadvallar: `pipelines`, `contacts`, `deals`, `notes`, `tasks`, `messages`, `calls`, `members`, `invites`, `integrations`, `webhook_log`
  - edge funksiyalar:
    - `instagram-webhook` — Meta webhook'ini qabul qiladi, mijoz va lid yaratadi
    - `instagram-send` — CRM'dan Instagram'ga javob yuboradi
    - `phone-webhook` — virtual ATS (OnlinePBX, Zadarma…) qo'ng'iroqlarini yozadi

## Kirish va jamoa

Birinchi ro'yxatdan o'tgan foydalanuvchi CRM egasi bo'ladi. Boshqa xodimlar faqat
Sozlamalar → Jamoa bo'limida taklif qilingan email bilan ro'yxatdan o'ta oladi.

## Instagram uchun kerakli maxfiy kalitlar (Supabase → Edge Functions → Secrets)

| Nomi | Qayerdan |
| --- | --- |
| `IG_APP_SECRET` | Meta Developers → ilova → Instagram → API setup with Instagram login → Instagram app secret |
| `IG_VERIFY_TOKEN` | O'zingiz o'ylab topgan istalgan so'z; Meta webhook sozlamasida ham xuddi shuni yozasiz |
| `IG_ACCESS_TOKEN` | O'sha sahifadagi "Generate token" (Instagram akkaunt uchun) |
