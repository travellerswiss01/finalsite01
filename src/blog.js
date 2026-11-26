import content from './blog-content.json' with {type:'json'};

export const BLOG_PATH='/blogs/aus-dem-laedeli';
export const articles=content.filter(article=>article.isPublished);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const articleUrl=article=>`${BLOG_PATH}/${encodeURIComponent(article.handle)}`;
export const plainText=value=>String(value||'').replace(/<[^>]*>/g,'').trim();
// The checked-in editorial snapshot comes from the merchant's published Shopify articles.
// Map Shopify links to this storefront's actual routes, without changing external links.
export function localArticleBody(body){return body.replace(/href="\/products\//g,'href="/produkte/').replace(/href="\/collections\/all"/g,'href="/sortiment"').replace(/href="\/pages\/contact"/g,'href="/kontakt"');}
function photo(article,eager=false){
 if(!article.image?.url)return '';
 const url=new URL(article.image.url);url.searchParams.set('width','800');
 return `<img src="${esc(url.href)}" alt="${esc(article.image.altText||article.title)}" width="800" height="650" loading="${eager?'eager':'lazy'}" decoding="async">`;
}
function cards(items){return items.map(article=>`<article class="journal-card"><a class="journal-photo" href="${articleUrl(article)}" aria-label="${esc(article.title)}">${photo(article)}</a><div class="journal-card-copy"><p class="journal-kicker">${esc(article.tags[0]||'Aus dem Lädeli')}</p><h2><a href="${articleUrl(article)}">${esc(article.title)}</a></h2><p>${esc(plainText(article.summary))}</p><a class="journal-read" href="${articleUrl(article)}">Artikel lesen <span aria-hidden="true">↗</span></a></div></article>`).join('');}
export function blogTeaser(){return `<section class="container journal-teaser" aria-labelledby="JournalTeaser"><div class="journal-heading"><div><p class="journal-kicker">GUTE IDEEN FÜR DEINEN ALLTAG</p><h2 id="JournalTeaser">Aus dem Lädeli</h2><p>Küchenideen, kleine Geschenke und ein Blick auf unsere Spezialitäten.</p></div><a class="journal-read" href="${BLOG_PATH}">Alle Artikel ansehen →</a></div><div class="journal-grid">${cards(articles.slice(0,3))}</div></section>`;}
export function blogIndex(){return `<section class="container journal-index"><header class="journal-intro"><p class="journal-kicker">BIOTTOS LÄDELI · DAS JOURNAL</p><h1>Aus dem Lädeli</h1><p>Was passt wozu? Was bringe ich mit? Und was steckt in der Flasche? Hier findest du Ideen, die sich im Alltag ausprobieren lassen.</p></header><div class="journal-grid">${cards(articles)}</div></section>`;}
export function articlePage(article){return `<article class="container journal-article"><nav class="breadcrumbs" aria-label="Brotkrumennavigation"><a href="/">Startseite</a> / <a href="${BLOG_PATH}">Aus dem Lädeli</a></nav><header class="journal-article-header"><div><p class="journal-kicker">${esc(article.tags.join(' · '))}</p><h1>${esc(article.title)}</h1><p class="journal-deck">${esc(plainText(article.summary))}</p><p class="journal-byline">Von Biottos Lädeli · ${Math.max(1,Math.ceil(plainText(article.body).split(/\s+/).length/180))} Minuten Lesezeit</p></div><div class="journal-article-photo">${photo(article,true)}</div></header><div class="journal-body">${localArticleBody(article.body)}<p class="journal-back"><a href="${BLOG_PATH}">← Alle Artikel aus dem Lädeli</a></p></div></article>`;}
