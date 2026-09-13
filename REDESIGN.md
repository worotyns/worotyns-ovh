# worotyns.ovh — stan obecny

Jedna strona, dwa tory, zero JavaScriptu. Wersja z `/blocks/split` przeszła na `/`, eksperymenty (`/simple/`, `/blocks/`) usunięte — zostają w historii gita.

## Struktura strony

```
hero (kim jestem, dwa CTA)
┌───────────────────────── matrix: 14 wyrównanych wierszy ─────────────────────────┐
│ Track 01 · Product & business        │ Track 02 · Technology & architecture      │
│ What I help with                      │ (4 pary usług)                            │
│ Track record                          │ PushPushGo, GetViaMsg — biznes | technologia │
│ Research & development                │ FPS, SBP — framing biznesowy | specyfikacja │
│ What I run today                      │ Terapeuto, uff.email, Krazeta, ceemes.    │
│ AI, two ways                          │ wdrożenie | operacja                      │
└───────────────────────────────────────────────────────────────────────────────────┘
On the record (3 nagrania z miniaturami i czasem trwania)
Compliance, folded into the work (4 kolorowe klocki)
closing CTA + stopka (llms.txt)
```

Kolejność grup jest celowa: **najpierw to, co można kupić, potem najmocniejszy dowód** (exit, skala), potem research, a dopiero na końcu własne produkty i AI. Wcześniej „What I run today" stało wyżej i undersprzedawało całość — produkty są wczesne, a PushPushGo jest najmocniejszym aktywem.

## Warstwa techniczna

- **blocks.css** (MIT, Linus Lee) vendored w `/vendor/` — dostarcza prymityw bloku, jego offsetowy obrys i fizykę hover. Typografia, przestrzeń i kolor są moje (`/styles.css`, ~350 linii)
- **Space Grotesk** w nagłówkach i treści, systemowy mono na metadanych, stackach, etykietach i stopce
- **kolor jako akcent**: terakota dla biznesu, teal dla technologii — tint komórki, kolor eyebrow, podkreślenie linku, kolor belki
- **tło**: kolorowy „blat" (piaskowy gradient, widoczny na całym viewporcie), strona jako arkusz z obramowaniem i miękkim cieniem
- zero JavaScriptu, zero cookies, zero trackingu
- **pomiar zimny: 10 żądań / 88 KB** (z tego ~20 KB font, ~22 KB miniatury YouTube)

### Reguły, których trzyma się ta strona

1. **Blok coś znaczy** — produkty, kafelki compliance, przyciski. Usługi i proza to typografia z hairline'ami.
2. **Karta = link** — cały kafelek produktu otwiera stronę w nowej karcie (`target="_blank" rel="noopener"`), bez widocznego linku w treści. Wyjątki: karty z dwoma linkami (whitepaper + implementacja) i ceemes., które otwiera maila, bo nie ma nic publicznego.
3. **Każda komórka biznesowa ma parę technologiczną** — `task check` tego pilnuje, bo brak pary psuje wyrównanie wierszy.

## Co pilnuje `task check`

Anchor links, brakujące pliki, wewnętrzne linki rozwiązane tak, jak zrobi to przeglądarka, wewnętrzne linki w `llms.txt`, JSON-LD, `llms.txt` (tytuł, streszczenie, stawka, kontakt, projekty), liczba par w macierzy, klikalność kart, `target`/`rel` na linkach zewnętrznych, nagrania + miniatury, obecność arkuszy `vendor/*` i `styles.css`.

## Reedycja komunikacji: startup jako główny odbiorca

Design, struktura macierzy i większość treści bez zmian — przestawiona została komunikacja.

- **hero** mówi teraz o decyzji foundera, nie o mnie: „I help founders make the calls that get expensive later." W leadzie jest, dlaczego to drogie: „cheap to get right at the start and expensive to unwind a year in", plus dowód (miliard zdarzeń, zespół piętnastu, akwizycja). Pod CTA jedna linia: „Senior product & technology advice at a startup-friendly 175 PLN/hour."
- **pas dowodów** tuż pod hero: 1B+ zdarzeń dziennie · 200+ klientów enterprise · 15 inżynierów · exit do Vercom S.A. + notka, że rady o skalowaniu i architekturze pochodzą z budowania i prowadzenia produktu, nie z samego konsultingu
- **sekcja „The three reasons startups hire me" przed macierzą** — trzy karty-klocki: Fractional CTO, Architecture & technical review, Product & business strategy. Każda linkuje do swojej podstrony usługowej (linkowanie wewnętrzne), więc sekcja jest jednocześnie doorwayem i nawigacją
- **„Where startups call me in" jako para biznes | technologia** — po trzy sytuacje na stronę, sformułowane słowami foundera (brak CTO i brak budżetu, architektura zaczyna boleć, zespół potrzebuje starszej perspektywy / nie wiadomo co dalej budować, spory o priorytety, pricing bez podstaw)
- **„Everything else I help with" jako para biznes | technologia** — pozostałe kompetencje w układzie tabeli (nazwa | opis), nic nie zostało usunięte. Trzy pozycje, które są już w doorwayu, mają przy sobie dopisek, że to ten sam obszar w wersji abonamentowej („row 02 run as a rolling review"), żeby nie wyglądały na dublet
- **stawka** w panelu zamykającym jest przedstawiona jako świadoma decyzja: 175 PLN/h celowo na poziomie dostępnym dla wczesnych zespołów, przy czym ta sama rada od pełnoetatowego CTO albo dużej firmy konsultingowej kosztuje wielokrotność. Panel zamykający pyta teraz „Bring me the decision that is keeping you up."
- **meta i `llms.txt`** przestawione na ten sam przekaz (tytuł: „Fractional CTO & CPO for startups"), a podstrony usługowe dostały to samo uzasadnienie stawki, żeby nie było sprzeczności

## Podstrony usługowe (SEO)

Dwa adresy pod frazy, każdy z **własną treścią** — nie kopią strony głównej, żeby nie dublować:

- **`/fractional-cto/`** — „Technical decisions, taken by someone who has paid for them before." Sekcje: gdzie mnie wołają (4 przypadki), jak wygląda współpraca (4 kroki), dowody (PPG / GetViaMsg / Terapeuto, framing techniczny), pytania, czego nie robię.
- **`/product-leadership/`** — „The product problem is rarely the product problem." Sekcje: gdzie mnie wołają, jak wygląda współpraca, dowody (PPG / Terapeuto / uff.email, framing biznesowy), pytania, czego nie robię.

Każda ma: własny `title` i `description` w limicie, canonical do siebie, `og:image` **własny** (generowany przez `task generate:og-image`), breadcrumb widoczny i w JSON-LD, `FAQPage` z trzema realnymi pytaniami, `Service` z ceną (`UnitPriceSpecification`, `unitCode: HUR`), linki w stopce strony głównej i wzajemne. `sitemap.xml` ma trzy adresy.

## Poprawka po reedycji: koncept dwóch torów

Pierwsza wersja reedycji wstawiła trzy grupy **pełnej szerokości** na sam początek macierzy (sytuacje, trzy powody, skonsolidowana lista kompetencji). Skutek: czytelnik dostawał trzy akapity bez podziału na tory, zanim zobaczył nagłówki „Track 01 / Track 02" — czyli dokładnie tam, gdzie koncept „tej samej pracy czytanej na dwa sposoby" miał się ustanowić. Koncept się rozjechał.

Naprawa: doorway został **przeniesiony przed macierz** (tam pełna szerokość jest naturalna, bo to wprowadzenie), a wewnątrz macierzy **wszystkie wiersze są znów parowane** biznes | technologia — sytuacje, lista kompetencji, track record, R&D, produkty, AI. Stan obecny: **12 wierszy, wszystkie pary, zero komórek pełnej szerokości wewnątrz macierzy**. `task check` pilnuje teraz także tego, że liczba komórek biznesowych równa się technologicznym, i że macierz nie ma wycieków.

## Linki i dostępność

- **Wszystkie linki zewnętrzne otwierają się w nowej karcie** (`target="_blank" rel="noopener"`) — i pilnuje tego checker dla każdej strony, nie tylko dla kart.
- Linki wewnętrzne (anchory, stopka, podstrony) zostają w tej samej karcie. Nowa karta dla własnej nawigacji psuje przycisk „wstecz" i jest antypatternem — jeśli chcesz inaczej, to jedna zmiana.
- Karty są dostępne z klawiatury, mają `aria-label` opisujący dokąd prowadzą („Terapeuto — terapeuto.com, opens in a new tab"), każdy `img` ma `alt` (dekoracyjne puste), każda strona ma dokładnie jeden `h1`.

## Stawka na stronie

**175 PLN / hour** jest teraz widoczne — w panelu zamykającym na stronie głównej i na obu podstronach, razem z informacją, że retainery i prace o stałym zakresie wyceniane są per projekt. `llms.txt` podaje tę samą kwotę.

## Co pilnuje `task check` (SEO)

Poza rzeczami strukturalnymi: długość `title` i `description` w limicie, canonical, `og:image` + `og:image:alt`, `twitter:card`, dokładnie jeden `h1`, `alt` na każdym obrazku, strony indeksowalne muszą być w `sitemap.xml`, a `sitemap.xml` nie może wskazywać nieistniejących plików. Strony z `noindex` (404) są z tego zwolnione.

## Do decyzji

1. **Opinie klientów** — odłożone przez Ciebie. To nadal jedyny brakujący element zaufania; mamy gotowe cytaty z Terapeuto, GetViaMsg i Interię o PushPushGo.
2. **`ceemes.eu`** — domena delegowana do Cloudflare, ale bez rekordu A/AAAA, więc link celowo wyprzedza stronę.
3. **Wersja polska** — treść jest po angielsku; gdyby klienci mieli być głównie z PL, `hreflang` i `/pl/` to naturalny następny krok (struktura jest już gotowa pod to).

## Historia decyzji (skrót)

Zaczęło się od strony jednego toru (Fractional CTO), przeszło przez: dwa tory z przełącznikiem JS → prosta wersja tekstowa → dwa realne adresy (C) → split screen na blocks.css → wyrównana macierz. Odpadło: przełącznik torów w JS (macierz pokazuje oba tory naraz), galeria wideo z fasadami (zastąpiona listą z miniaturami), sekcja „Security & compliance" jako osobna proza (rozdzielona do konkretnych projektów plus pasek klocków).
