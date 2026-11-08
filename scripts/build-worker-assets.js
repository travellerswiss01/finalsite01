import {statSync, writeFileSync} from 'node:fs';

const film = new URL('../public/assets/imagefilm.mp4', import.meta.url);
const metadata = new URL('../src/worker-assets.generated.js', import.meta.url);
writeFileSync(metadata, `export const imageFilmSize = ${statSync(film).size};\n`);
