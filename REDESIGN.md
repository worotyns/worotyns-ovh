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

## Do decyzji

1. **Stawka 175 PLN/h** — nadal tylko w `llms.txt`. Strona jej nie pokazuje.
2. **Opinie klientów** — usunięte przy przejściu na tę wersję. To jedyny element, którego brakuje najbardziej: dla konsultanta 2–3 cytaty z nazwiskiem ważą więcej niż cała reszta strony.
3. **ISO 27001 / NIS2** — w pasku compliance jako „practices" i „technology risk", nie jako certyfikaty. Potwierdzone jako ok, ale warto pilnować, żeby nie brzmiało jak certyfikat.
4. **`ogimage.jpg`** — generowany z tej strony (`task generate:og-image`), do odświeżenia po każdej większej zmianie układu.
5. **Podstrony SEO** — przy jednym URL-u Google widzi jedną ofertę. Gdyby wrócić do pomysłu `/fractional-cto` i `/product-leadership`, to teraz najtańszy sposób na dwa wejścia.

## Historia decyzji (skrót)

Zaczęło się od strony jednego toru (Fractional CTO), przeszło przez: dwa tory z przełącznikiem JS → prosta wersja tekstowa → dwa realne adresy (C) → split screen na blocks.css → wyrównana macierz. Odpadło: przełącznik torów w JS (macierz pokazuje oba tory naraz), galeria wideo z fasadami (zastąpiona listą z miniaturami), sekcja „Security & compliance" jako osobna proza (rozdzielona do konkretnych projektów plus pasek klocków).
