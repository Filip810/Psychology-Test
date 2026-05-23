# Bateria Testów Poznawczych

Aplikacja webowa do przeprowadzania baterii testów poznawczych ANT (Attention Network Test) i SART (Sustained Attention to Response Task). Wyniki są zapisywane automatycznie do Google Sheets przez Google Apps Script.

**Demo:** https://filip810.github.io/Psychology-Test/

---

## Testy

- **ANT** — Test Sieci Uwagi (3 bloki × 96 prób + 24 treningowe). Mierzy czas reakcji i dokładność w zależności od rodzaju podpowiedzi (brak / przestrzenna / podwójna).
- **SART** — Test Hamowania Odpowiedzi (3 bloki × 300 prób). Mierzy błędy pominięcia i błędy komisji (naciśnięcie przy cyfrze 3).

---

## Zewnętrzne zasoby i licencje

### Inter — czcionka

**Źródło:** Google Fonts — https://fonts.google.com/specimen/Inter  
**Autor:** Rasmus Andersson  
**Licencja:** SIL Open Font License 1.1

> Copyright 2020 The Inter Project Authors (https://github.com/rsms/inter)
>
> This Font Software is licensed under the SIL Open Font License, Version 1.1.
> This license is available with a FAQ at: https://openfontlicense.org
>
> PERMISSION & CONDITIONS
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of the Font Software, to use, study, copy, merge, embed, modify, redistribute,
> and sell modified and unmodified copies of the Font Software, subject to the
> following conditions:
>
> 1. Neither the Font Software nor any of its individual components, in
>    Original or Modified Versions, may be sold by itself.
> 2. Original or Modified Versions of the Font Software may be bundled,
>    redistributed and/or sold with any software, provided that each copy
>    contains the above copyright notice and this license.
> 3. No Modified Version of the Font Software may use the Reserved Font Name(s)
>    unless explicit written permission is granted by the corresponding Copyright
>    Holder.
> 4. The Font Software may not be modified, altered, or added to, and in
>    particular the designs of glyphs or characters in the Fonts may not be
>    modified nor may additional glyphs or characters be added to the Font
>    Software without first obtaining explicit written permission from the
>    respective Copyright Holder.
>
> Full license text: https://openfontlicense.org/open-font-license-official-text/

### Google Fonts API

Czcionka Inter jest ładowana przez Google Fonts CDN.  
Korzystanie z Google Fonts podlega **Google Fonts Terms of Service** oraz **Google Privacy Policy**:  
- https://developers.google.com/fonts/terms  
- https://policies.google.com/privacy

---

## Technologia

Cały kod aplikacji (HTML, CSS, JavaScript) napisany od zera — **bez zewnętrznych bibliotek JS/CSS**. Jedyna zewnętrzna zależność to czcionka Inter z Google Fonts (patrz licencja powyżej).

---

## Uruchomienie

Otwórz `index.html` w dowolnej przeglądarce na komputerze z klawiaturą.  
Test wymaga połączenia z internetem (Google Fonts + Google Apps Script).
