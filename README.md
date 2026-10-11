# Biottos Lädeli – Shopify Storefront

Responsive Webseite nach dem gelieferten Mockup mit dem echten Shopify-Katalog von `biottoslaedeli.myshopify.com`. Kein statischer Produkt-Datensatz: Produkte, Bilder, Varianten, Verfügbarkeit, Preise und Checkout stammen aus der Storefront API.

![Startseite mit echten Shopify-Produkten](docs/startseite-desktop.png)

## Lokal starten

Node.js 24 oder neuer installieren, danach:

```sh
npm ci
cp .env.example .env
npm run dev
```

Webseite: http://localhost:3000. Für den Produktionsbetrieb `npm start` verwenden.

## Funktionen

- Startseite mit Original-Logo, Marktstand-Bild und dynamischen Geschenkboxen.
- Vollständiges Sortiment mit Produkt- und Varianten-Paginierung, Suche und Kategorien.
- Produktdetailseiten mit vollständiger Beschreibung, Bildern und Variantenwahl.
- Shopify-Warenkorb-Drawer: hinzufügen, Menge ändern, entfernen; bleibt bei Seitenwechsel und Neuladen erhalten.
- Checkout über die von Shopify erzeugte Checkout-Adresse. Versand, Steuern, Zahlung und Bestellung verarbeitet Shopify.
- Shopify ist die verbindliche Instanz für Verfügbarkeit und Warenkorbpreise. Lagerwarnungen werden angezeigt.
- Kontaktformular öffnet einen vorausgefüllten E-Mail-Entwurf; Versand erfolgt durch den Kunden. Kein stiller Formularversand.
- Rechtstexte werden aus den im Shopify-Shop hinterlegten Richtlinien geladen.
- Serverseitig gerenderte Produktseiten, strukturierte Produktdaten, Sitemap und responsive Bilder.

## Bereitstellen

### Vercel

Dieses Repository als Projekt importieren. Framework-Preset **Other**, Build-Befehl leer lassen, Node.js **24.x** wählen. `api/index.js` und `vercel.json` liefern die dynamischen Seiten und die Warenkorb-API; Bilder, CSS und JavaScript liegen in `public/assets`.

Umgebungsvariablen: `SHOPIFY_STORE_DOMAIN=biottoslaedeli.myshopify.com` und `SHOPIFY_API_VERSION=2026-10`. `PUBLIC_ORIGIN` auf die endgültige HTTPS-Adresse setzen, sobald die Domain feststeht. Ohne diese Variable verwendet Vercel die jeweils angefragte HTTPS-Domain, damit Preview-Deployments funktionieren. Eine localhost-Adresse darf nicht im veröffentlichten Projekt stehen.

### Node.js / Docker

```sh
docker build -t biottos-storefront .
docker run --rm -p 3000:3000 --env-file .env biottos-storefront
```

Beim Hosting hinter einem HTTPS-Proxy `PUBLIC_ORIGIN=https://deine-domain.ch` setzen. Der Server hört auf `PORT`, standardmässig 3000.

## Shopify-Konfiguration

Der aktuelle Shop unterstützt den öffentlichen, tokenlosen Storefront-Zugriff. Falls sich die Zugriffskonfiguration ändert, einen **Storefront**-Token über `SHOPIFY_STOREFRONT_TOKEN` auf dem Server setzen. Niemals einen Admin-API-Token verwenden. Produkte müssen im Online Store veröffentlicht sein; ausgeblendete Entwürfe werden nicht verkauft.

Neue veröffentlichte Produkte erscheinen automatisch; der Katalog wird 30 Sekunden zwischengespeichert. Die drei Startseiten-Geschenke werden bevorzugt über `chli-fii`, `fein-guet`, `gross-guet` ausgewählt. Redaktionelle Startseitentexte und Kontaktadresse stehen in `src/render.js`, Farben und Layout in `public/assets`.

## Prüfen

```sh
npm run check
npm test
npm run test:live
```

`test:live` kontaktiert den echten Shop und legt einen Testwarenkorb an, prüft alle verfügbaren Varianten, Preise, Mengenänderung, Entfernen und Checkout-Adresse. Danach wird der Warenkorb geleert. Es wird keine Bestellung aufgegeben und keine Zahlung ausgelöst. Nicht als wiederholten CI-Test ausführen.

## Validierung und verbleibende Grenzen

Stand der aktuellen Prüfung (11. Oktober 2026): Die GitHub-Actions-Prüfung auf PR-Commit `394034e` war erfolgreich; `npm run check` und `npm test` liefen durch, 39/39 Tests bestanden. Im Browser wurden 35 unterschiedliche Seitenrouten geprüft. Der Warenkorb-POST schlägt auf den beiden Live-Domains weiterhin mit der Origin-Schutzmeldung fehl.

Der Shopify-Checkout wurde nur in einer Render-Vorschau auf dem Basisbranch `codex/mockup-homepage` (Commit `192aee34`) geöffnet. Diese Vorschau enthält nicht den PR-Fix und beweist daher nicht, dass der Fix live funktioniert. Es wurde keine Bestellung ausgelöst.

Mobile Ansichten wurden in dieser Prüfung nicht vollständig verifiziert. 375-px- und 768-px-Darstellung sind offen. Auch Lighthouse/Core Web Vitals sind nicht abschliessend gemessen.

Das Mockup liefert keine exakte Schriftdatei oder Hover-Spezifikation: Georgia/Arial und dunklerer roter Hover sind Annahmen. Der Footer ergänzt funktionale Navigation und vorhandene Shopify-Rechtstexte. Domain, Hosting und Mailversand werden durch das Repository allein noch nicht veröffentlicht.
