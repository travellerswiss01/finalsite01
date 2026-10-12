import {readFile,writeFile} from 'node:fs/promises';
// Export the embedded artwork as an ordinary same-origin WebP at build time.
// This keeps the site's strict image security policy unchanged.
const source=await readFile(new URL('../public/assets/mosti-domino.svg',import.meta.url),'utf8');
const data=source.match(/href="data:image\/webp;base64,([A-Za-z0-9+/=]+)"/);
if(!data)throw new Error('Mosti artwork is missing or invalid');
const image=Buffer.from(data[1],'base64');
if(image.toString('ascii',0,4)!=='RIFF'||image.toString('ascii',8,12)!=='WEBP')throw new Error('Mosti artwork must be WebP');
await writeFile(new URL('../public/assets/mosti-domino.webp',import.meta.url),image);

// Export the transparent juice group through the same asset pipeline.
const trioSource=await readFile(new URL('../public/assets/suessmost-trio.svg',import.meta.url),'utf8');
const trioData=trioSource.match(/href="data:image\/webp;base64,([A-Za-z0-9+/=]+)"/);
if(!trioData)throw new Error('Juice trio artwork is missing or invalid');
const trioImage=Buffer.from(trioData[1],'base64');
if(trioImage.toString('ascii',0,4)!=='RIFF'||trioImage.toString('ascii',8,12)!=='WEBP')throw new Error('Juice trio must be WebP');
await writeFile(new URL('../public/assets/suessmost-trio.webp',import.meta.url),trioImage);
