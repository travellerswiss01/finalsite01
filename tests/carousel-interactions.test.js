import test from 'node:test';
import assert from 'node:assert/strict';
import {home} from '../src/render.js';
import {normalizedProduct} from './fixtures.js';

test('homepage starts with a static photo and two routes to the shop',()=>{
 const product={...normalizedProduct,productType:'Geschenkskorb',title:'Beispielkorb'};
 const page=home([product]);
 assert.match(page,/<h1 id="HeroHeading">Hausgemachte Spezialitäten &amp; Geschenke aus dem Thurgau<\/h1>/);
 assert.match(page,/src="\/assets\/firmen-geschenke\.webp"/);
 assert.match(page,/href="\/geschenkkoerbe">Geschenkkörbe ansehen/);
 assert.match(page,/href="\/sortiment">Zum Sortiment/);
 assert.doesNotMatch(page,/data-offer-|data-vinegar-(?:motion|sound)/);
 assert.ok(page.indexOf('Beispielkorb')<page.indexOf('Spezialitäten entdecken'));
});
