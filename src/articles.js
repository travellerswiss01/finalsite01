export const journalPath = '/vom-obstbaum-zum-balsamico';
const series = 'Vom Obstbaum zum Balsamico';

export const articles = new Map([
  ['33-apfelsorten', {
    title: '33 Apfelsorten in einem Balsamico – warum so viele?',
    description: 'Was 33 Apfelsorten ausmachen und wie aus Apfelmost unser Apfelbalsamico entsteht.',
    image: 'garden-aepfel.jpg',
    alt: 'Äpfel im Wägeli',
    paragraphs: [
      'Leg zwei verschiedene Äpfel nebeneinander und probier je ein Stück. Der eine kann süss schmecken, der andere säuerlich oder herber. Genau diese Unterschiede machen eine Mischung spannend. Wer nur eine Sorte probiert, bekommt einen ganz anderen Eindruck vom Obstgarten.',
      'In unserem Apfelbalsamico stecken 33 Apfelsorten. Aus den Äpfeln entsteht Most. Zum Balsamico gehören bei uns Apfelessig und eingedickter Apfelmost. So kommt das Obst in zwei Formen in die Flasche, einmal mit der Säure des Essigs und einmal mit der konzentrierten Süsse des Mosts.',
      'Wenn du den Balsamico probierst, nimm zuerst ein paar Tropfen auf einen Löffel. Was fällt dir zuerst auf – die Säure, die Süsse oder der Apfel?'
    ],
    products: [['apfelbalsamico', 'Apfelbalsamico entdecken']]
  }],
  ['vom-most-zum-apfeldicksaft', {
    title: 'Wie werden aus 24 Litern Most 2,4 Liter Apfeldicksaft?',
    description: 'Vom Apfelmost zum Dicksaft. Ein Blick in die Herstellung unseres Apfelbalsamicos.',
    image: 'suessmost-3-liter.webp',
    alt: 'Süssmost von Biottos Lädeli',
    paragraphs: [
      '24 Liter Apfelmost passen in einen grossen Topf. Was bei unserer Charge nach dem Einkochen übrig bleibt, sind 2,4 Liter Apfeldicksaft. Auf dem Löffel sieht man den Unterschied sofort. Most läuft schnell herunter. Der Dicksaft fliesst langsamer und bleibt länger am Löffel hängen.',
      'Beim Einkochen verdampft Wasser. Der Zucker, der schon im Apfelmost steckt, bleibt zurück und konzentriert sich. So wird der Most dickflüssiger.',
      'Für unseren Apfelbalsamico haben wir die 2,4 Liter Apfeldicksaft mit 2,4 Litern Apfelessig gemischt. Das ergibt rund 4,8 Liter Balsamico. Wenn du beim nächsten Salat einen Schuss davon ins Dressing gibst, steckt also in jedem Löffel ein Stück von diesem eingekochten Most.'
    ],
    products: [['apfelbalsamico', 'Apfelbalsamico entdecken']]
  }],
  ['apfel-oder-birne-zu-kaese', {
    title: 'Apfel oder Birne – welcher Balsamico passt besser zu Käse?',
    description: 'Zwei Stücke vom selben Käse und je ein paar Tropfen Balsamico. So probierst du den Unterschied.',
    image: 'troepfli-heimat.webp',
    alt: 'Flaschen aus dem Sortiment von Biottos Lädeli',
    paragraphs: [
      'Schneid zwei gleich grosse Stücke vom selben Käse ab. Gib ein paar Tropfen Apfelbalsamico aufs erste Stück und gleich viel Birnenbalsamico aufs zweite. So merkst du beim Probieren, was der Balsamico verändert.',
      'Zu einem würzigen Hartkäse würde ich mit Apfel anfangen. Zu einem milden Weichkäse würde ich zuerst Birne probieren. Unser Birnenbalsamico ist dünnflüssiger als der Apfelbalsamico und verteilt sich auf einem kleinen Stück Käse schnell.',
      'Am spannendsten wird es, wenn zwei Leute mitprobieren. Gebt euch die Stücke ohne Ankündigung und sagt erst danach, welches euch besser schmeckt. Vielleicht bekommt die Käseplatte am Ende einfach beide Flaschen dazu.'
    ],
    products: [['apfelbalsamico', 'Apfelbalsamico entdecken'], ['birnen-balsamico', 'Birnenbalsamico entdecken']]
  }]
].map(([slug, article]) => [`${journalPath}/${slug}`, article]));

export function journalPage(article) {
  if (article) {
    return {
      title: article.title,
      description: article.description,
      content: `<article class="container page-content journal-article">
        <p><a href="${journalPath}">Alle Beiträge der Serie</a></p>
        <h1>${article.title}</h1>
        <img class="journal-photo" src="/assets/${article.image}" alt="${article.alt}" decoding="async">
        ${article.paragraphs.map(paragraph => `<p>${paragraph}</p>`).join('')}
        <ul class="journal-products">${article.products.map(([handle, label]) => `<li><a href="/produkte/${handle}">${label}</a></li>`).join('')}</ul>
      </article>`
    };
  }

  const description = 'Aus unserem Thurgauer Obstgarten. Wie wir Apfel- und Birnenbalsamico machen und wie du beides probieren kannst.';
  return {
    title: series,
    description,
    content: `<section class="container page-content journal-index">
      <h1>${series}</h1>
      <p>${description}</p>
      <div class="journal-entries">${[...articles].map(([path, entry]) => `<article>
        <h2><a href="${path}">${entry.title}</a></h2>
        <p>${entry.description}</p>
      </article>`).join('')}</div>
    </section>`
  };
}
