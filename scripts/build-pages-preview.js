import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {home,shell} from '../src/render.js';

// Static design preview: use the exact current carousel and immutable original assets.
const assetRef=process.argv[2]||'33eb8a3b7209583e06a5837b6406aef86321ef3b';
if(!/^[a-f0-9]{40}$/.test(assetRef))throw new Error('Pass the full GitHub commit SHA for the preview assets.');
const assetBase='https://raw.githubusercontent.com/travellerswiss01/finalsite01/'+assetRef+'/public/assets/';
const css=['base.css','sections.css','site.css'].map(name=>readFileSync(new URL('../public/assets/'+name,import.meta.url),'utf8')).join('\n');
const app=readFileSync(new URL('../public/assets/app.js',import.meta.url),'utf8');
const carousel='const announcementTicker='+app.split('const announcementTicker=')[1];
if(!carousel.includes('data-vinegar-sound'))throw new Error('The current carousel was not found.');
const content=home([]).split('<section class="featured container"')[0]+'<aside id="PreviewNote" class="container preview-note"><p><strong>Designvorschau des Karussells</strong></p><p>Aktueller Stand mit Originalfotos, Etikettenansicht und optionalem Glasklang. Weitere Seiten, Warenkorb und Bestellungen benötigen den vollständigen Shop.</p></aside>';
let html=shell(content,{title:'Karussell – Designvorschau',origin:'https://travellerswiss01.github.io/finalsite01'});
html=html.replace(/<link rel="canonical"[^>]*>/,'').replace('<head>','<head><meta name="robots" content="noindex,nofollow">');
html=html.replace(/<link rel="stylesheet" href="\/assets\/[^"]+">/g,'');
html=html.replace('<script src="/assets/app.js" type="module"></script>','<style>'+css+'\n.preview-note{padding-block:28px;font-size:15px;color:#47564e}</style><script type="module">'+carousel+'</script>');
html=html.replace(/<dialog id="CartDrawer"[\s\S]*?<\/dialog>/,'');
html=html.replace(/href="\/(?!assets\/)[^"]*"/g,'href="#PreviewNote"');
html=html.replaceAll('/assets/',assetBase);
mkdirSync(new URL('../docs/',import.meta.url),{recursive:true});
writeFileSync(new URL('../docs/index.html',import.meta.url),html);
writeFileSync(new URL('../docs/.nojekyll',import.meta.url),'');
console.log('Generated docs/index.html with the current carousel; asset commit '+assetRef);
