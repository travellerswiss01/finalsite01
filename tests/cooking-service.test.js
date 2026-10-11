import test from 'node:test';
import assert from 'node:assert/strict';
import {cookingService, shell} from '../src/render.js';

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
});

test('Kochservice is linked and marked current in the site navigation',()=>{
 const html=shell(cookingService(),{path:'/kochservice',title:'Kochen mit Lucia im Thurgau'});
 assert.match(html,/<a href="\/kochservice" aria-current="page">Kochservice<\/a>/);
 assert.match(html,/<title>Kochen mit Lucia im Thurgau \| Biottos Lädeli<\/title>/);
});
