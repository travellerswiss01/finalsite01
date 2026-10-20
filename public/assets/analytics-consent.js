// Analytics is strictly opt-in. No Google request is made before consent.
const KEY='biottos_analytics_consent_v1';
const ID='G-KDMVVC7ESQ';
let started=false;
function startAnalytics(){
 if(started)return;
 started=true;
 window.dataLayer=window.dataLayer||[];
 window.gtag=function(){window.dataLayer.push(arguments);};
 window.gtag('js',new Date());
 window.gtag('config',ID,{anonymize_ip:true});
 const script=document.createElement('script');
 script.async=true;
 script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(ID);
 document.head.append(script);
}
function getConsent(){try{return localStorage.getItem(KEY);}catch{return null;}}
function setConsent(value){const wasStarted=started;try{localStorage.setItem(KEY,value);}catch{}if(value==='accepted')startAnalytics();else if(wasStarted){location.reload();return;}render(false);}
const dialog=document.createElement('section');
dialog.id='AnalyticsConsent';
dialog.setAttribute('aria-label','Datenschutzeinstellungen');
dialog.style.cssText='position:fixed;bottom:12px;left:12px;right:12px;max-width:560px;margin:auto;background:#fff;color:#172c22;padding:18px;border:1px solid #bec8c0;border-radius:12px;box-shadow:0 5px 30px #0003;z-index:2147483647;font:16px/1.5 system-ui,sans-serif';
dialog.innerHTML='<strong>Datenschutz bei Biottos Lädeli</strong><p style="margin:8px 0">Dürfen wir Google Analytics verwenden, um die Nutzung unserer Website zu verstehen? Dabei können Daten an Google übermittelt werden. Du kannst freiwillig zustimmen oder ablehnen und deine Wahl jederzeit ändern.</p><div style="display:flex;flex-wrap:wrap;gap:10px"><button type="button" data-consent="rejected" style="padding:9px 14px;cursor:pointer">Ablehnen</button><button type="button" data-consent="accepted" style="padding:9px 14px;cursor:pointer">Analytics erlauben</button></div>';
dialog.querySelectorAll('[data-consent]').forEach(button=>button.addEventListener('click',()=>setConsent(button.dataset.consent)));
const settings=document.createElement('button');
settings.type='button';
settings.textContent='Cookie-Einstellungen';
settings.setAttribute('aria-label','Analytics-Einwilligung ändern');
settings.style.cssText='position:fixed;bottom:8px;left:8px;z-index:2147483646;font:12px system-ui,sans-serif;background:#fff;color:#172c22;border:1px solid #aaa;border-radius:6px;padding:5px 8px;cursor:pointer';
settings.addEventListener('click',()=>render(true));
function render(force){dialog.hidden=!force&&getConsent()!==null;settings.hidden=!dialog.hidden;}
document.body.append(dialog,settings);
if(getConsent()==='accepted')startAnalytics();
render(false);
