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

dialog.innerHTML='<strong>Datenschutz bei Biottos Lädeli</strong><p>Dürfen wir Google Analytics verwenden, um die Nutzung unserer Website zu verstehen? Dabei können Daten an Google übermittelt werden. Du kannst freiwillig zustimmen oder ablehnen und deine Wahl jederzeit ändern.</p><div class="consent-actions"><button type="button" data-consent="rejected">Ablehnen</button><button type="button" data-consent="accepted">Analytics erlauben</button></div>';
dialog.querySelectorAll('[data-consent]').forEach(button=>button.addEventListener('click',()=>setConsent(button.dataset.consent)));
const settings=document.createElement('button');
settings.type='button';settings.id='AnalyticsSettings';
settings.textContent='Cookie-Einstellungen';
settings.setAttribute('aria-label','Analytics-Einwilligung ändern');

settings.addEventListener('click',()=>render(true));
function render(force){dialog.hidden=!force&&getConsent()!==null;settings.hidden=!dialog.hidden;}
document.body.append(dialog,settings);
if(getConsent()==='accepted')startAnalytics();
render(false);
