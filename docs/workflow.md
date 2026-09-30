# dsgn — jak se se systémem pracuje

Praktický provoz design systému: kde co žije, jak ho projekt použije a upraví, jak funguje Figma a předání z Figmy do kódu.

## Kde co žije

**Zdroj pravdy je repozitář design systému**: konfigurace tokenů (`src/tokens.config.mjs`), CSS komponent, `dsgn.js`, testy a build. Z něj vzniká všechno ostatní:

| Výstup | Pro koho | Obsah |
|---|---|---|
| npm balíček `dsgn.systems` | vývojáři | `dsgn.css`, `dsgn.js`, tokeny (DTCG JSON), proměnné pro Figmu |
| Figma knihovna (publikovaná) | designéři | proměnné s módy, komponenty se sloty, textové styly, šablony |
| Dokumentační web | všichni | živé ukázky, kód, tokeny, pravidla použití |

Každé vydání má **jedno číslo verze pro balíček i Figma knihovnu**.

- **Patch** (1.4.1): oprava.
- **Minor** (1.5.0): nová komponenta, token nebo varianta; nic se nerozbije.
- **Major** (2.0.0): přejmenování nebo odstranění třídy, tokenu či varianty. V changelogu je popsaný přechod.

## Použití v projektu (kód)

```bash
npm i dsgn.systems
```

Načíst `dsgn.css` (a `dsgn.js`, pokud stránka má taby, menu, tooltipy, toasty, slider, číselné pole, vyhledávání nebo chipy) a psát HTML s třídami `dsgn-*` a atributy `data-*`. Nic se nekompiluje: funguje s čistým HTML, WordPressem, Astrem i Reactem. Aktualizace: `npm update`, co se změnilo, řekne changelog.

## Customizace na projekt (od nejčastější po nejvzácnější)

1. **Motiv projektu**: `dsgn.theme.mjs` v projektu, jen parametry:
   - odstín a sytost pro akcent, neutrál a stavové barvy (chyba, úspěch, varování),
   - písmo, výchozí zaoblení, výchozí denzita.

   `npx dsgn build` vygeneruje CSS projektu a proměnné pro Figmu a **spustí kontrolu kontrastu**. Když barva klienta kontrast nezvládne, build selže a řekne, který pár a o kolik.
2. **Atributy za běhu**: `data-theme`, `data-density`, `data-radius` na celé stránce i na jedné sekci. Příklad: aplikace v S, marketingový web v L, tmavý pás uprostřed světlé stránky.
3. **Přepsání sémantického tokenu** (např. `--dsgn-surface-raised`) v CSS projektu. Jen výjimečně, obchází kontrolu kontrastu.
4. **Zdokumentované háčky komponent**:
   - `--side`: šířka bočního panelu,
   - `--min`: minimální šířka sloupce v automatické mřížce,
   - `--dsgn-icon-size`: velikost ikony.

   Proměnné `--_*` jsou interní a mohou se změnit bez ohlášení.
5. **Vlastní komponenty projektu**: v projektu, ale jen z tokenů. Lint design systému jde spustit i na CSS projektu a pohlídá, že v nich nejsou pevné hodnoty v px a neznámé tokeny. Když se komponenta hodí jinde, jde jako návrh do design systému.

Nikdy se needituje `node_modules` a systém se neforkuje. Balíček bude v CSS vrstvě `@layer dsgn`, takže CSS projektu vyhraje vždy, i s jednoduchým selektorem.

## Figma v projektu

- Projektový soubor zapne knihovnu dsgn: komponenty, proměnné, textové styly.
- **Brand klienta = další mód v kolekci Color**, vygenerovaný stejným generátorem jako CSS, takže barvy v kódu a ve Figmě jsou totožné.
- Designér skládá obrazovky z instancí a slotů a na rámech přepíná módy: Color (brand a světlý/tmavý), Density, Radius a Layout (mobil/tablet/desktop).
- Pravidla:
  - nerozpojovat instance,
  - žádné barvy ani rozměry mimo proměnné,
  - co knihovna nemá, nakreslit na stránku **Návrhy** a označit jako návrh, nikdy tiše uvnitř obrazovky.

## Předání z Figmy do kódu

- Vývojář otevře obrazovku ve Figmě v režimu **Dev Mode**.
- **Code Connect** u každé instance ukáže HTML design systému s atributy podle vlastností instance. Například `Button, Variant=Subtle, Intent=Neutral` → `<button class="dsgn-button" data-variant="subtle" data-intent="neutral">`.
- Proměnné se jmenují stejně jako CSS tokeny, textové styly stejně jako třídy. Nic se nepřeměřuje.
- Vývojář řeší rozvržení stránky z primitiv (Section, Grid, Stack, Cluster, Split), obsah a logiku, ne vzhled komponent.

## Jak vzniká nová komponenta

1. Potřeba vznikne v projektu: návrh ve Figmě nebo požadavek vývojáře.
2. Rozhodne se, jestli jde o obecnou věc. Když ne, zůstane v projektu jako vlastní komponenta z tokenů.
3. Když ano, postaví se **nejdřív v kódu** design systému: lint, test mřížky, kontrola kontrastu.
4. Objeví se v token artifactu (build selže, pokud tam chybí).
5. Přes MCP se vytvoří ve Figmě.
6. **Kontrola shody** ověří, že Figma a kód sedí.
7. Vydá se nová minor verze balíčku i knihovny a projekt si ji natáhne.

## Rozhodnuto (30. 9. 2026)

- **Balíček**: `dsgn.systems` na veřejném npm, licence MIT.
- **Repozitář**: [github.com/NovamaStudio/dsgn.systems](https://github.com/NovamaStudio/dsgn.systems), veřejný. CI při každém pushi sestaví a otestuje, tag `v1.2.3` vydá balíček na npm a dokumentaci na GitHub Pages.
- **Figma plán**: Professional. Znamená to:
  - Proměnné přes REST API (jen Enterprise) nejdou, kontrola shody Figma ↔ kód běží ručně přes MCP.
  - **Code Connect** (jen Organization a Enterprise) nejde. Náhrada: každá komponenta ve Figmě má v popisu značkování (třída + `data-*`) a odkaz na svou stránku dokumentace; Dev Mode i MCP je vývojáři ukážou. Popisy generuje build ze stejných zdrojů jako dokumentaci, takže nezastarají.
