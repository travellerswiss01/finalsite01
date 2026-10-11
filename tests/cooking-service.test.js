import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cookingService, home, shell} from '../src/render.js';

test('Lucia has a dedicated service page with the agreed offer and a prepared inquiry',()=>{
 const page=cookingService();
 assert.match(page,/Kochen mit Lucia<br>bei dir zu Hause/);
 assert.match(page,/Geburtstage, Familienfeiern/);
 assert.match(page,/bis zu 20 Personen im Kanton Thurgau/);
 assert.match(page,/deckt den Tisch, kocht in deiner Küche und serviert/);
 assert.match(page,/Abwasch und räumt die Küche auf/);
 assert.match(page,/name="guests" type="number" min="1" max="20"/);
 assert.match(page,/data-subject="Kochservice-Anfrage für Lucia"/);
 assert.match(page,/src="\/assets\/lucia-kocht\.jpg"/);
 assert.match(page,/class="cooking-inspiration"/);
 assert.match(readFileSync(new URL('../public/assets/sections.css',import.meta.url),'utf8'),/url\('\/assets\/lucia-salate\.webp'\)/);
 assert.equal((page.match(/class="cooking-menu-image"/g)||[]).length,7);
 for(let i=1;i<=7;i++)assert.match(page,new RegExp(`/assets/lucia-menu-${i}\\.webp`));
});

test('homepage rotates matching gift and cooking photos without changing the hero structure',()=>{
 const page=home([]);
 assert.equal((page.match(/data-offer-image/g)||[]).length,5);
 assert.match(page,/src="\/assets\/lucia-hero-banner\.webp"/);
 assert.match(page,/src="\/assets\/hero\.jpg"/);
 assert.match(page,/<h1 id="HeroHeading">Geschenke aus<br>dem Thurgau<\/h1>/);
 assert.match(page,/Geschenkkörbe entdecken/);
 assert.match(page,/Lucia kocht<br>für dich/);
 assert.match(page,/href="\/kochservice">Lucias Kochservice entdecken/);
 assert.equal((page.match(/data-offer-slide/g)||[]).length,5);
 assert.match(page,/aria-hidden="true" inert/);
 for(const path of ["/kontakt","/geschenk-konfigurator","/saisonales"])assert.ok(page.includes(`href="${path}"`));
 assert.match(page,/Firmengeschenke anfragen/);
 assert.match(page,/src="\/assets\/troepfli-heimat\.webp"/);
 assert.match(page,/Saisonales entdecken/);
});

test('Kochservice is linked and marked current in the site navigation',()=>{
 const html=shell(cookingService(),{path:'/kochservice',title:'Kochen mit Lucia im Thurgau'});
 assert.match(html,/<a href="\/kochservice" aria-current="page">Kochservice<\/a>/);
 assert.match(html,/<title>Kochen mit Lucia im Thurgau \| Biottos Lädeli<\/title>/);
});
