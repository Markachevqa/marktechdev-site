# Сайт-визитка Марк-Тех

Одностраничный статический сайт: заказная разработка ПО для бизнеса. Боевой адрес — [https://marktechdev.ru](https://marktechdev.ru) (без www). Достаточно загрузить содержимое этой папки на GitHub Pages или Cloudflare Pages и привязать домен.

## Что ещё нужно перед публикацией

| Что | Где | Статус |
| --- | --- | --- |
| Домен сайта | `index.html` (canonical, Open Graph, Twitter, JSON-LD), `privacy.html`, `robots.txt`, `sitemap.xml` | Указан `https://marktechdev.ru` |
| Приём заявок | Форма `#lead-form` в `index.html`: атрибуты `action` и `data-endpoint` | Заглушка Formspree `YOUR_FORM_ID`. Пока при отправке открывается письмо на `yumarkachev@yandex.ru` |

Контактная почта на сайте: `yumarkachev@yandex.ru`. Телефон компании не публикуется. Посетитель в форме может оставить свой телефон или email.

## Публикация на marktechdev.ru

Сайт статический, серверная часть не нужна. Домен — вершина зоны (`marktechdev.ru`), не `www`. После смены DNS подождите, пока записи разойдутся (от нескольких минут до суток), затем включите HTTPS.

### GitHub Pages

1. Создайте репозиторий и загрузите файлы из этой папки в корень (не во вложенный каталог).
2. В репозитории: **Settings → Pages**. Источник — ветка `main` (или `master`), папка `/ (root)`.
3. В поле **Custom domain** укажите `marktechdev.ru` и сохраните. GitHub добавит в корень файл `CNAME` со строкой `marktechdev.ru` — его нужно закоммитить.
4. У регистратора домена (.ru: например, REG.RU, Ru-Center, Timeweb) в DNS зоны `marktechdev.ru` задайте записи вершины `@`:

   | Тип | Имя | Значение |
   | --- | --- | --- |
   | A | `@` | `185.199.108.153` |
   | A | `@` | `185.199.109.153` |
   | A | `@` | `185.199.110.153` |
   | A | `@` | `185.199.111.153` |
   | AAAA | `@` | `2606:50c0:8000::153` |
   | AAAA | `@` | `2606:50c0:8001::153` |
   | AAAA | `@` | `2606:50c0:8002::153` |
   | AAAA | `@` | `2606:50c0:8003::153` |

   Удалите старые A/AAAA/CNAME на `@`, если регистратор подставил парковочные адреса. Проверка: `dig marktechdev.ru +noall +answer -t A`.
5. Когда домен в настройках Pages станет зелёным, включите **Enforce HTTPS**.

По желанию, чтобы запрос на `www.marktechdev.ru` тоже открывал сайт, добавьте CNAME `www` → `<пользователь>.github.io` и укажите оба имени в настройках Pages. Канонический адрес в разметке — `https://marktechdev.ru`.

### Cloudflare Pages

1. В Cloudflare: **Workers & Pages → Create → Pages**. Подключите репозиторий или загрузите папку сайта. Папка сборки — корень, команда сборки не нужна.
2. **Custom domains → Set up a custom domain**: `marktechdev.ru`.
3. DNS удобнее вести в Cloudflare (на регистраторе .ru смените NS-записи на те, что покажет Cloudflare). Тогда для вершины зоны Cloudflare сам сделает CNAME flattening на `*.pages.dev`, отдельно прописывать A-записи GitHub не нужно.
4. Если DNS остаётся у регистратора и он умеет ALIAS/ANAME для вершины, направьте `@` на адрес проекта вида `<проект>.pages.dev`. Обычный CNAME на `@` многие регистраторы .ru не принимают — тогда перенесите DNS в Cloudflare.
5. Дождитесь выпуска сертификата в панели Pages (HTTPS включится сам).

По желанию добавьте `www.marktechdev.ru` как второй домен в Pages и редирект на `https://marktechdev.ru`.

### После деплоя

- В [Google Search Console](https://search.google.com/search-console) и [Яндекс.Вебмастере](https://webmaster.yandex.ru/) добавьте ресурс `https://marktechdev.ru` и отправьте `https://marktechdev.ru/sitemap.xml`.
- Когда подключите Formspree (или аналог), замените `action` формы и удалите `data-endpoint="placeholder"`.

## Логотипы

Исходные знаки — в `logo-concepts/`. На сайте — концепция 3 в палитре «уголь и шампанское золото»: `logo-concepts/aristocratic/d-charcoal-champagne.svg` (копия в `assets/logo.svg` и `assets/favicon.svg`).
