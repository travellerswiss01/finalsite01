# Verifizierte Produktbewertungen – Implementierungsplan

Status: Vorbereitung, **nicht live**. Keine Testbewertungen als echte Bewertungen ausgeben.

## Bestehende Architektur
- Node.js HTTP-Server in `src/server.js`; Produktkatalog via Shopify Storefront API (`src/storefront.js`).
- Shopify Checkout: Eine Storefront-API-Verbindung allein berechtigt nicht dazu, Bestellungen oder Käuferidentitäten zu lesen.
- Für die Verifikation sind ein Shopify-Admin-App-Zugang mit minimalen Berechtigungen und eine serverseitige Datenbank nötig. Keine Admin-Tokens im Browser.

## Sicherer Ablauf
1. Shopify sendet signierte Webhooks über bezahlte bzw. abgeschlossene Bestellungen. HMAC-Signatur anhand des unveränderten Request-Bodys prüfen, wiederholte Webhooks idempotent verarbeiten.
2. Speichere nur notwendige Zuordnung von Bestellung, Produkt-ID, Käuferkontakt und Status. Retention/Datenschutz festlegen.
3. Nach Kauf eine einmalige, zufällige, kurzlebige Bewertungseinladung pro bestelltem Produkt erstellen. Nur Token-Hash speichern, Rate-Limits anwenden. Einladungen über zulässigen E-Mail-Versand verschicken.
4. Käufer kann 1–5 Sterne und optionalen Kommentar abgeben. Token serverseitig prüfen und einmalig verbrauchen. Keine öffentliche Selbstkennzeichnung als „verifizierter Kauf“.
5. Bewertungen mit `pending` speichern; Moderation auf Spam, persönliche Daten und Beleidigungen. Sachliche negative Bewertungen nicht aufgrund ihrer Sterne unterdrücken.
6. Freigegebene Bewertungen auf der zugehörigen Produktseite sichtbar darstellen. Nur tatsächlich veröffentlichte Bewertungen in `Product.review` und `Product.aggregateRating` ausgeben; bei null Bewertungen beide Felder weglassen.
7. Tests: ungültige HMAC, Replay, doppelte Bestellung, abgelaufener Token, falsche Produkt-ID, XSS, Rate-Limit, Moderation, Nullbewertungen und JSON-LD-Konsistenz.

## Noch zu klären, bevor die Funktion produktiv aktiviert werden kann
- Shopify-App/Admin-API-Zugriff auf notwendige Bestellereignisse und Webhook-Einrichtung.
- Persistente Datenbank, Secret-Verwaltung, E-Mail-Versand, Moderationszugang.
- Datenschutztext und Löschfristen.
- Vorschau-Test mit synthetischen Bestellungen, danach ausdrückliche Freigabe für Livebetrieb.

**Nicht implementiert:** Webhooks, Datenspeicher, Einladungsversand, UI und Schema-Markup. Diese Planung ist keine lauffähige Bewertungsfunktion.
