export const business=Object.freeze({
 name:'Biottos Lädeli',email:'biottoslaedeli@gmail.com',phone:'+41523653658',phoneDisplay:'052 365 36 58',
 street:'Hauptstrasse 90',postalCode:'8357',locality:'Guntershausen',district:'Maischhausen',region:'Thurgau',country:'CH',
 hours:'Mo–Sa 08:00–22:00 Uhr · Sonntag geschlossen',
 days:['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],opens:'08:00',closes:'22:00'
});
export const addressText=`${business.street}, ${business.postalCode} ${business.locality} (${business.district})`;
