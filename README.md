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

Stand der Prüfung: 19 veröffentlichte Produkte, 22 Varianten; 13 automatisierte Tests bestanden. Live-Warenkorb und alle 25 Seitenrouten geprüft. Desktop 1440 px, Tablet 768 px und Mobile 375 px werden zusätzlich im Browser geprüft.

Das Mockup liefert keine exakte Schriftdatei oder Hover-Spezifikation: Georgia/Arial und dunklerer roter Hover sind Annahmen. Der Footer ergänzt funktionale Navigation und vorhandene Shopify-Rechtstexte. Checkout und Zahlungsabwicklung bleiben im Shopify-Checkout; dessen Abschluss wurde bewusst nicht mit einer echten Bestellung getestet. Domain, Hosting und Mailversand werden durch das Repository allein noch nicht veröffentlicht.
