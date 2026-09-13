# worotyns.ovh — v2

Stan: **zbudowane i przetestowane**, gotowe do `task deploy:prod`.
Podgląd lokalnie: `task serve` → http://localhost:8912

---

## 1. Koncept, który wdrożyłem

Jeden URL, dwa tory. Przełącznik w headerze (`Business` / `Technology`) zmienia **nie tylko tekst, ale cały język wizualny** — paletę, typografię, promienie zaokrągleń i rytm. Strona sama sobą pokazuje, że mówisz oboma językami.

| | Tor BIZNES | Tor TECH |
|---|---|---|
| Paleta | ciepły piaskowy + terakota | chłodny grafit + teal |
| Nagłówki | Instrument Serif (italic) | Inter + mono na akcentach |
| Kicker | `HOW I HELP` | `[ 01 ] — HOW I HELP` |
| Statystyki | serif italic: `Exit`, `200+` | mono: `1B+`, `30 days` |
| Promienie | 14 px, pill | 8 px, prostokąt |
| Panel w hero | „gdzie jestem użyteczny" (produkt / cena / rynek / zespół) | terminal z ASCII-diagramem i `$ ppg --stats` |

### Najmocniejszy element: te same projekty, dwie prawdy

Cztery projekty opisane dwa razy — raz efektem, raz architekturą. Przełącznik zmienia karty w miejscu, więc widać to natychmiast:

- **GetViaMsg** — BIZ: *„57% czytelników ucieka na paywallu, jeden SMS odblokowuje artykuł, wypłata w 1 dzień zamiast 60"* · TECH: *„session-based payment, webhooki operatorów, idempotentne rozliczenia, DORA, Fly.io + Cloudflare"*
- **PushPushGo** — BIZ: *„200+ klientów enterprise, exit do Vercom S.A."* · TECH: *„event-driven delivery na bare metal, 1B+ zdarzeń dziennie, hurtownia danych"*
- **Terapeuto** — BIZ: *„0% prowizji od wizyty, grafik w 15 minut"* · TECH: *„multi-tenant, AES-256, pełne pokrycie e2e, lead time ~2 dni"*
- **uff.email** — BIZ: *„asystent, którego zatrudniasz nadając mu imię"* · TECH: *„agent email-native, pamięć w grafie wiedzy, izolacja per adres"*

---

## 2. Struktura strony

1. **Hero** — awatar, jedna twarz, dwa leady, przełącznik, statystyki per tor, panel per tor
2. **Two tracks** — brama wyboru toru (też przełącznik, klikalna)
3. **About** — dwa różne akapity o tej samej osobie
4. **Services** — 4 karty per tor (biz: strategia, pricing, GTM, fractional CPO / tech: fractional CTO, architektura, DD, engineering leadership)
5. **How it runs** — 4 kroki, w każdym inny *deliverable* per tor
6. **Work** — 5 kafelków (4 projekty + otwarty slot)
7. **Experience** — timeline 2016 → exit 2021 → CPO → CTO → dziś, plus ściana klientów (tekst, bez cudzych logotypów)
8. **Testimonials** — Terapeuto, GetViaMsg, PushPushGo
9. **On the record** — galeria trzech nagrań: podcast FinTalks (Future Processing) jako wyróżniony + dwa filmy z okresu PPG (OVH Experience: skalowanie 5K → 500M notyfikacji dziennie, oraz Przedsiębiorca Roku UW). Każdy z facadą: YouTube ładuje się dopiero po kliknięciu, więc strona nie ciągnie skryptów Google przy wejściu.
10. **Security & compliance** — DORA / NIS2 / ISO 27001
11. **Contact** — CTA + „co się stanie po kliknięciu" (3 kroki) + e-mail / telefon / LinkedIn / GitHub

---

## 3. Co doszło poza wyglądem

- **`llms.txt`** — maszynowy opis Ciebie dla asystentów AI (ChatGPT, Claude, Perplexity itd.), w formacie `llms.txt`: tytuł, streszczenie, kluczowe fakty, usługi per tor, produkty z linkami, doświadczenie, opinie, sekcja „notes for AI assistants" z instrukcją cytowania i zakazem wymyślania liczb. **Stawka godzinowa: 175 PLN/h.** Plik jest linkowany w `<head>` (`rel="alternate"`) i w stopce, żeby był odkrywalny.
- **`404.html`** — wcześniej każdy nieistniejący adres zwracał stronę główną z kodem 200 (Cloudflare Pages SPA-fallback), co robi duplikaty w Google. Teraz jest prawdziwe 404 z `noindex`.
- **`_headers`** — nagłówki bezpieczeństwa (HSTS, nosniff, Referrer-Policy, Permissions-Policy) i cache dla statyków.
- **`scripts/check.mjs`** + `task check` — sprawdza martwe anchory, brakujące pliki, niezbalansowane warianty torów, zepsuty JSON-LD, placeholdery, długość linii w panelu ASCII i kompletność `llms.txt` (tytuł, streszczenie, stawka, kontakt, wszystkie 4 projekty).
- **Awatar** — pobrany z LinkedIna i przycięty lokalnie (`avatar.jpg`, 22 KB, 320×320). Linki z LinkedIna wygasają, więc kopia u siebie jest konieczna. Użyty raz, w sekcji About.
- **GitHub** — `github.com/worotyns` jako link w sekcji About (tor tech), w kontakcie i w JSON-LD, z `rel="me"`.
- **Trzy nagrania** — galeria wideo z podpisami pod kartami (nie na miniaturze, bo napisy wbudowane w miniaturę FinTalks kolidowały z podpisem). Fallback miniatur: `maxresdefault` → `hqdefault` → czysta karta w firmowym gradiencie, więc świeżo wgrany lub prywatny film nie pokaże złamanej ikony. Wszystkie trzy nagrania są też wypisane w `llms.txt`, a `task check` pilnuje, żeby liczba facao i wpis w `llms.txt` się zgadzały.
- **`ogimage.jpg`** — wygenerowany ponownie z nowego designu (1200×630, ciemny tor tech): `task generate:og-image`.
- **JSON-LD** — rozszerzone: `founder` (Terapeuto, uff.email), `worksFor` (GetViaMsg), `sameAs` (LinkedIn + GitHub), `knowsAbout` z pricingiem i GTM.
- **Sitemap** — z `lastmod`.
- Zero zależności i zero build-stepu: czysty HTML/CSS/JS, `wrangler pages deploy` działa jak dotąd.

## 3a. Runda poprawek po Twoim review

| Co zgłosiłeś | Co było naprawdę | Fix |
|---|---|---|
| „buttony się rozjechały" | przełącznik toru: pill miał **93 px**, a aktywny przycisk **84 px** (biz) / **101 px** (tech) — bo etykiety mają różną szerokość, a `min-width: auto` blokował równy podział | równe `min-width` per breakpoint (`--lane-opt-w`), pomiar po fixie: pill = przycisk co do piksela w obu torach |
| powtórzenie awatara i nazwiska w topbarze i hero | byline w hero duplikował brand z headera | byline usunięty; zdjęcie zostało raz, w About, z linią „Kraków, Poland · working in English and Polish" |
| testimoniale po polsku | dwa z trzech cytatów były PL | przetłumaczone na EN; podpis „on the PushPushGo platform" zostaje, bo to opinia o produkcie, nie o Tobie |
| — (znalazłem sam) | nawigacja + przełącznik nie mieściły się w jednej linii w zakresie 780–1000 px | menu zwija się teraz poniżej 1000 px zamiast 780 px |
| — (znalazłem sam) | `.btn-primary` bez ramki vs `.btn-secondary` z ramką = różnica geometrii | `border: 1px solid transparent` na obu, `white-space: nowrap` |

Przetestowane po poprawkach: **16 szerokości (320→1440) × 2 tory — zero przepełnień poziomych**, zero błędów JS, przełączanie/`localStorage`/skróty/menu/wideo działają.


### Jak działają tory technicznie

`<html data-lane="tech">` + atrybuty w treści (`.only-biz` / `.only-tech`). Przełączanie podmienia atrybut i zapisuje wybór w `localStorage`; skróty klawiszowe `B` i `T`; `View Transitions API` z fallbackiem; wsparcie dla `?track=biz|tech`. Warianty tekstu są **w DOM od początku** — Google widzi oba, więc nie tracisz treści przez JS. Przetestowane: 8 szerokości × 2 tory, zero przepełnień poziomych, zero błędów JS.

---

## 4. Fakty, które doszły z researchu (do weryfikacji!)

Sprawdziłem publiczne źródła i użyłem: **Vercom S.A. nabył 67,42% udziałów PushPushGo 8 lipca 2021 za 9,43 mln zł** (z opcjami na resztę po 24 i 48 miesiącach, sfinansowane z IPO). Testymonial z landing page PushPushGo (Karolina Leputa, Interia) jest podpisany jako opinia o platformie, nie o Tobie — dlatego w karcie jest *„on the PushPushGo platform"*. Ściana klientów: TUI, POLITICO, Auchan, Douglas, Hearst, Aller, Planeta Sport, Home&You, Lubimyczytać, Interia, SEISKA.FI, Suomi24 — **wszystkie z ich własnej strony „Trusted by"**.

---

## 5. Decyzje domyślne — powiedz słowo i zmienię

| Decyzja | Co zrobiłem | Jak zmienić |
|---|---|---|
| Domyślny tor | **tech** (ostrzejsza oferta, obecne SEO już łapie „fractional CTO") | `data-lane="tech"` w `<html>` + domyślna wartość w skrypcie inline |
| Nazwy torów | Business / Technology | `.lane-opt` w headerze + `data-lane-set` |
| „1B+ zdarzeń dziennie" | użyłem Twojej liczby z odpowiedzi (LinkedIn mówi 1,5 mld) | 3 miejsca: statystyki, projekt PPG, panel ASCII |
| Bez cen na stronie | stawka **175 PLN/h jest tylko w `llms.txt`**, strona bez cen | dopisanie stawki do sekcji Contact to jedna linia — powiedz słowo |
| Bez zdjęć projektów | kafelki są tekstowe | wrzucimy screenshoty — to największy pojedynczy skok jakości |
| Dark mode zostaje osobnym przełącznikiem | tor zmienia paletę, motyw jest niezależny | — |
| Język | EN, cytaty po polsku z `lang="pl"` | mogę zrobić pełne PL jako `/pl/` |

---

## 6. Do potwierdzenia przed deployem

1. **ISO 27001 i NIS2** — zostawiłem w sekcji compliance, bo były na starej stronie. Realne doświadczenie czy aspiracja? (DORA jest realna — GetViaMsg.)
2. **Rok założenia PushPushGo** — LinkedIn: styczeń 2016, strona firmy: „działamy od 2017". Na stronie mam 2016.
3. **Telefon publicznie** — zostawiłem `+48 790 793 138`. Zostaje czy wywalamy?
4. **Stack konkretnych projektów** — dla Terapeuto i uff.email napisałem opisy kompetencji (multi-tenant, graf wiedzy), bo nie znam użytych technologii. Daj listę (języki, chmury, bazy), to podmienię tagi w torze tech.
5. **`200+ klientów enterprise`** — Twoja liczba. Trzymamy „200+" czy „prawie 200"?
6. **Stawka 175 PLN/h** — jest w `llms.txt`. Pokazujemy ją też na stronie (sekcja Contact), czy zostaje tylko dla LLM-ów?
7. **Cytaty** — mam trzy. Jeśli masz zgodę na podanie imion/nazwisk przy opiniach z Terapeuto (te trzy dłuższe ze strony), dodam je — opinia z nazwiskiem waży więcej.

---

## 7. Runda 3 (R&D, navbar, naprawa martwego CTA)

| Zmiana | Detal |
|---|---|
| Zdjęcie w navbarze | Marka `MW` zastąpiona Twoim zdjęciem (`avatar.jpg`, 34 px). Koło w torze biznesowym, zaokrąglony kwadrat w technicznym — tak samo jak portret w sekcji About. |
| Nowa sekcja **R&D** (`#rnd`, między Experience i Testimonials) | WDFT PSA jako band z ramką w kolorze akcentu + dwie karty konceptów. Wszystko opisane na podstawie `docs.wdft.ovh`, nie z nazw: FPS (federated registry, SDK/QR do aplikacji banku, dwa podpisane webhooki `complete`/`confirm`, < 0.01 PLN, brak intermediariuszy, PoC sandbox) i SBP (sesje, commitmenty, agregacja, wypłaty — wdrożone jako GetViaMsg). |
| `Oracle Cloud` w GetViaMsg | Doszedł do tagów i opisu w torze tech oraz do `llms.txt` (teraz: Fly.io · Cloudflare · Oracle Cloud — trójchmurowość). |
| **Martwe CTA** | „Start with a 30-minute call →" na karcie „Your project here" było `<span>` w `<article>` — nie dało się kliknąć. Karta jest teraz linkiem `mailto:` z prewypełnionym tematem, a `task check` ma regułę: każda karta projektu musi być linkiem albo zawierać link. |
| Numeracja sekcji w torze tech | Przenumerowana po dodaniu R&D: work [03], experience [04], R&D [05], testimonials [06], talk [07], security [08], contact [09]. |
| Rytm tła | Naprawiony po wstawieniu sekcji: naprzemiennie jasne/alt, bez dwóch takich samych pasów pod rząd. |
| GitHub w kontakcie | Etykieta skrócona do `/worotyns`, równolegle do `in/worotyns` przy LinkedInie. |
| `llms.txt` | Nowa sekcja „Research & development — WDFT PSA" z oboma whitepaperami, rolami w SBP i statusem każdego konceptu. |

**Uwaga:** zdjęcie pojawia się teraz dwa razy na stronie — w navbarze (34 px) i w sekcji About (88 px). Powiedz, jeśli mam zostawić tylko jedno.

## 9. Wersja C — prostota + dwa realne adresy (`/simple/`)

Wybrany wariant: układ i typografia z wersji simple, ale **przełącznik torów zostaje** — nie jako JS, tylko jako **dwa osobne adresy**:

- `/simple/` — tor biznesowy (product & business)
- `/simple/tech/` — tor techniczny (fractional CTO & architecture)

Przełącznik to zwykłe linki tekstowe pod nagłówkiem; aktualny tor oznaczony pogrubieniem, drugi jest linkiem. To rozwiązuje problem SEO, który zgłaszałem w rundzie 1: Google nie zaindeksuje dwóch wariantów jednego URL-a jako dwóch ofert, a tutaj każda oferta ma własny adres.

Zasady, które się trzymają:

- **zero JavaScriptu** — brak przełącznika JS, animacji, fasad wideo; nagrania to zwykłe linki
- **zero webfontów** — systemowy stos fontów (na stronie głównej same fonty to 131 KB z 268 KB transferu)
- **jedna kolumna**, bez kart, cieni, zaokrągleń
- **dark mode** przez `prefers-color-scheme`, bez przycisku i bez `localStorage`
- treść toruje się na poziomie sekcji: „What I help with", „What I run today", „AI" i wybór nagrań mają inne framing w każdym torze; R&D, compliance i kontakt są wspólne

Pomiar (Chrome, zimny start, cache wyczyszczony):

| | Pełna wersja (`/`) | Wersja C (`/simple/`) |
|---|---|---|
| Żądania | 9 | **4** |
| Transfer | 268 KB | **21 KB** |
| w tym fonty | 131 KB (Google Fonts) | **0** |
| w tym arkusz | 40 KB | **4 KB** |
| w tym zdjęcie | 22 KB (`avatar.jpg`, 320 px) | **8 KB** (`avatar-96.jpg`) |
| JavaScript | 8 KB | **0 B** |

Po drodze złapałem dwa realne błędy, oba z tej samej rodziny (ścieżki względne vs serwowany URL): przełącznik prowadził do `/tech/` zamiast `/simple/tech/` (bo `../tech/` liczone od `/simple/` wychodzi poza katalog), a strona biznesowa ładowała **główny** arkusz 40 KB zamiast `simple/styles.css`. Oba naprawione, a `task check` dostał twarde reguły: każdy wewnętrzny link musi rozwiązać się do istniejącego pliku, a strony eksperymentu muszą ładować `simple/styles.css`.

Czego wersja C nie ma względem pełnej: kart projektów z tagami i stackami w dwóch odsłonach, galerii wideo z miniaturami, opinii, ściany klientów, panelu ASCII i zapamiętywania wybranego toru przy reloadzie (tu tor trzyma URL).

## 10. Co proponuję dalej (kolejność wg zwrotu)

1. **Podstrony SEO** `/fractional-cto/` i `/product-leadership/` — przełącznik toru jest świetny dla człowieka, ale Google nie zaindeksuje dwóch wariantów jednego URL-a jako dwóch osobnych ofert. Dwie lekkie strony na tym samym CSS + linki z głównej.
2. **Screenshoty projektów** (4 obrazki) — zamiana kafelków tekstowych na wizualne.
3. **Case studies** `/work/pushpushgo`, `/work/terapeuto`, `/work/getviamsg`, `/work/uff-email` — po jednym ekranie: problem → decyzje → wynik → stack. Linki z kafelków już mają sens, brakuje podstron (dlatego 404 ma o nich wzmiankę).
4. **Blog** — domena ma historię bloga (`/blog` w indeksie Google). Jeśli wrócisz do pisania, dołożę `/blog/` na tym samym CSS. Dla konsultanta treść = leady.
5. **Sekcja cenowa lub „jak wygląda współpraca"** z widełkami — najczęstsze pytanie w pierwszym mailu.
