// Confirmed by the owner on 19 October 2026. One cart unit is one kilogram.
export const saleUnits=Object.freeze({'apfel-gemischt':'kg','birnen-gemischt':'kg','tomaten-gemischt':'kg'});
export const saleUnit=product=>saleUnits[product?.handle]||'';
export const tidyText=value=>String(value??'').replace(/[ \t]+/g,' ').replace(/\b(\d+(?:[.,]\d+)?)\s*(ml|dl|kg|g)\b/gi,'$1 $2').replace(/\bca\.\s*(?=\d)/g,'ca. ').replace(/([.,:;])(?=[A-Za-zÄÖÜäöü])/g,'$1 ').trim();
export function productDescription(product){
 let text=tidyText(product.description);
 if(product.handle==='birnenessig'&&product.variants?.length>1)text=text.replace(/^Inhalt:\s*5\s*dl\s*/i,'').replace(/^vergorener/,'Vergorener');
 if(!text)text=`${tidyText(product.title)} bei Biottos Lädeli. Abholung in Guntershausen (Maischhausen).`;
 return text;
}
export function presentProduct(product){
 const title=tidyText(product.title);
 const variants=product.variants.map(v=>({...v,title:tidyText(v.title),image:v.image?{...v.image,altText:product.variants.length>1?title:v.image.altText}:null}));
 const picture=img=>img?{...img,altText:product.variants.length>1?title:img.altText}:img;
 return {...product,title,description:productDescription(product),featuredImage:picture(product.featuredImage),images:product.images.map(picture),variants};
}
export function metaDescription(product){
 const text=productDescription(product).replace(/\s+/g,' ');
 if(text.length<=160)return text;
 const cut=text.slice(0,157);return cut.slice(0,cut.lastIndexOf(' '))+'…';
}
