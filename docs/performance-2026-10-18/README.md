# Performance-Prüfung – Biottos Lädeli

Stand: 19. Oktober 2026 (Europe/Zurich). Keine Veröffentlichung auf Produktion.

- Vorschau: https://biottos-laedeli-pr-28.onrender.com
- Pull Request: https://github.com/travellerswiss01/finalsite01/pull/28
- Branch: `perf/mobile-pagespeed-20261018`
- Getesteter App-Commit: `25f51b3f5bd9eda138d1f861d98359282c59d83b`
- Produktions-Baseline: `604ca63524486866cf931b24b05a61d4d9189152`
- Render-Deploy der Vorschau: `dep-dbajmq5g1s2s73be9ra0`, Status live.

## Ergebnis

Lokale Lighthouse-13.5.0-Messungen gegen die öffentlichen URLs, Chromium 153, simulierte Drosselung, frische Browser-Speicherzustände. Die Vorschau wurde nach dem Kaltstart gemessen. Das sind **keine neuen Google-PageSpeed-Insights-Messungen** und keine CrUX-Nutzerdaten. Netzwerkzugriff aus dieser Umgebung läuft über einen Proxy; Einzelwerte schwanken. Desktop und Mobil verwenden unterschiedliche, in measurements.json dokumentierte Konfigurationen.

| Messwert | Produktion mobil, 1 Lauf | Vorschau mobil, Median (Min–Max), 3 Läufe | Produktion Desktop, 1 Lauf | Vorschau Desktop, Median (Min–Max), 3 Läufe |
|---|---:|---:|---:|---:|
| Leistung | 68 | **99 (92–99)** | 92 | **100 (91–100)** |
| Barrierefreiheit | 100 | 100 (100–100) | 100 | 100 (100–100) |
| Best Practices | 100 | 100 (100–100) | 100 | 100 (100–100) |
| SEO | 100 | 69 (69–69) | 100 | 69 (69–69) |
| LCP | 1,38 s | 1,82 s (1,79–1,87) | 0,81 s | 0,59 s (0,58–0,69) |
| FCP | 1,31 s | 1,34 s (1,34–1,37) | 0,66 s | 0,57 s (0,56–0,59) |
| TBT | 0 ms | 0 ms | 0 ms | 0 ms |
| CLS | 0,545 | 0 | 0,021 | 0,021 (0,021–0,021) |
| Speed Index | 12,32 s | 2,59 s (2,57–7,95) | 3,06 s | 0,80 s (0,75–3,99) |
| Übertragung | 3.480.777 B | 516.698 B | 3.211.461 B | 323.583 B |

Mobile Leistungsläufe: **92, 99, 99**. Desktop: **91, 100, 100**. Mobil rund **85 % weniger übertragene Daten**, Desktop rund **90 % weniger**.

Der niedrigere SEO-Wert der Vorschau entsteht durch Render `X-Robots-Tag: noindex`. Dieser Schutz bleibt absichtlich bestehen. Es ist nicht zulässig, den Produktions-SEO-Wert nach einem Merge bereits als gemessen zu behaupten. Nach einer Freigabe sollte auf der echten Domain erneut PSI ausgeführt werden.

Der ursprüngliche Nutzerbericht hatte mobil 78 Punkte, LCP 5,6 s, CLS 0 und Desktop 99. Die frische Baseline zeigt andere LCP/CLS-Werte; deshalb wird keine konstante LCP-Verbesserung gegenüber allen Läufen behauptet. Der nachgewiesene Vorteil ist der stabile initiale Hero, deutlich weniger Daten und die besseren Gesamtwerte dieser Vergleichsmessung.

## Ursachen und Änderungen

1. Zuvor war serverseitig der Most-Hero aktiv. JavaScript wechselte sofort auf Folie 4 und forderte grosse Flaschen-SVGs an. Jetzt liefert der Server Folie 4 samt sichtbarer H1 und Flaschen direkt aus. Automatische Rotation ist opt-in; alle Angebote sind über Pfeile erreichbar.
2. Die Flaschen-SVGs enthalten Rasterbilder. Transparente WebP-Vorschaubilder mit 640 px Höhe reduzieren sieben Dateien von rund 3,1 MB unkomprimierten SVG-Daten auf 161 KB. Ein AVIF-Vergleich ergab noch kleinere Dateien; gewählt wurde die visuell geprüfte WebP-Version. Original-SVGs bleiben für die vergrösserte Etikettenansicht erhalten.
3. Responsive Mostbilder und ein kleineres Videoposter. Die drei Geschenkfotos werden als passende lokale WebP-Grössen ausgeliefert. Die vollständige Shopify-Quell-URL inklusive Versionsparameter muss übereinstimmen; nach einem Bildwechsel in Shopify wird automatisch wieder das neue Shopify-Bild verwendet.
4. Nicht sichtbare saisonale Bilder und Mosti-Posen laden erst bei Bedarf. Mosti und laufende Effekte werden beim Verlassen des sichtbaren Bereichs beziehungsweise bei verborgenem Tab zurückgesetzt/angehalten; reduzierte Bewegung bleibt berücksichtigt.
5. Ein gebündeltes Stylesheet erhält die ursprüngliche CSS-Reihenfolge. Inhalts-Hashes versionieren statische Dateien und eingebettete Ressourcenverweise. Nur der passende Hash erhält ein Jahr `immutable`; unversionierte/veraltete URLs revalidieren. ETag, Brotli/Gzip und HEAD bleiben unterstützt. Warenkorb/API/HTML bleiben `no-store`.
6. Der zugängliche Warenkorbname enthält den sichtbaren Zähler. Die grosse Überschrift überlagert auf Laptopbreiten nicht mehr die erste Flasche.

## Prüfung

- Syntaxprüfung erfolgreich; **63 Tests bestanden**, auch GitHub Actions auf dem getesteten App-Commit.
- Mobiler Browser: Karussell, Most 3/5/10 Liter, Mosti, Originaletiketten, Videowiedergabe, Produktvariante, Warenkorb 1→2→1, Entfernen, Geschenkkonfigurator und Grusskarte bestanden.
- Shopify-Checkout wurde erreicht; kostenlose Abholung am Standort wurde angezeigt. Keine Bestellung, Zahlung oder Anmeldung ausgelöst. Testwarenkorb anschliessend geleert.
- Sortiment, Saisonales, Kochservice, Garten und Kontakt antworteten erfolgreich. Keine JavaScript-Ausnahmen im geprüften Ablauf.
- Finale Zusatzprüfung: neue Geschenkderivate, nachgeladene saisonale Bilder und Mosti-Stopp ausserhalb des Sichtbereichs erfolgreich.
- Kein eigener Cookie-Auswahldialog im geprüften Frontend vorgefunden; daher kein solcher Ablauf als getestet ausgewiesen.
- Vorher/Nachher-Screenshots: mobil 412×915 und Desktop 1350×940, jeweils vollständige Seite; visuell geprüft.

## Grenzen und nächster Schritt

100/100 in allen vier Kategorien ist **nicht vollständig erreicht**: mobiler Median 99, Vorschau-SEO 69 durch absichtliches noindex. Der langsamere erste warme Lauf zeigt weiterhin Schwankungen beim visuellen Laden. Kein spezieller Lighthouse-Inhalt, kein Verstecken von Kundeninhalten.

Die kostenlose Render-Instanz schlief nach Inaktivität ein. Bei Wiederaufnahme gab es drei fehlgeschlagene mobile Messversuche mit HTTP 503; Logs zeigen einen Prozessneustart um 22:26:54–22:26:58 UTC und danach wieder HTTP 200. Diese Fehler werden nicht als Performance-Nullwerte gemittelt. Ein Hosting-Upgrade wurde nicht vorgenommen. Zuverlässige Erstaufrufe nach Ruhezeit können nicht allein durch diese Frontend-Optimierung garantiert werden.

Freigabe zur Produktion steht aus. Die ursprüngliche Hauptdomain bleibt unverändert. Nach Freigabe: Merge, Render-Deploy prüfen und PSI auf der echten Domain neu messen; keine Ranking- oder CrUX-Garantie.

## Nachweise

- [Einzelmessungen mit Zeitstempeln und Konfiguration](measurements.json)
- [Funktionsprüfungen](functional-checks.json)
- [Mobil vorher](before-mobile.webp) · [Mobil nachher](after-mobile.webp)
- [Desktop vorher](before-desktop.webp) · [Desktop nachher](after-desktop.webp)
