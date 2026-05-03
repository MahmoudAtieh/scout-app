# نظام إدارة وحدة الفتيان الكشفية

تطبيق PWA يعمل دون إنترنت لإدارة وحدة كشفية (أعضاء، لقاءات، حضور، مهام، مالية، تقارير).

## المتطلبات
- Node.js 20+
- حساب Supabase (المستوى المجاني يكفي)

## التشغيل المحلي

```bash
npm install
cp .env.example .env.local
# عدّل .env.local بمفاتيح Supabase
npm run dev
```

ثم افتح http://localhost:3000

## إعداد Supabase

1. أنشئ مشروعاً جديداً على https://supabase.com
2. شغّل ملفات `supabase/migrations/*.sql` بالترتيب (عبر SQL Editor)
3. انسخ `Project URL` و `anon key` إلى `.env.local`

## النشر

### Vercel
```bash
npm i -g vercel
vercel
```
أضف متغيرات البيئة في لوحة تحكم Vercel.

## هيكل المشروع
- `app/` — صفحات Next.js
- `components/` — مكوّنات UI
- `lib/supabase/` — عميل Supabase
- `lib/db/` — IndexedDB (Dexie)
- `lib/crypto/` — تشفير AES-GCM
- `lib/export/` — تصدير Excel و PDF
- `supabase/migrations/` — ملفات SQL

## الأدوار
- **leader (قائد):** صلاحية كاملة
- **supervisor (مشرف):** قراءة كاملة + كتابة الحضور والمحاضر وتحديث المهام

## الميزات
- دعم العربية RTL كاملاً
- PWA يعمل دون إنترنت مع مزامنة تلقائية
- تشفير AES-256 للحقول الحساسة (هواتف، هوية)
- 7 مجالات منهج قابلة للتعديل
- 140 مهمة جاهزة بثلاثة مستويات
- محضر لقاء بـ 7 فقرات
- تقارير PDF/Excel
- لوحة تحكم بمخططات تفاعلية
