const $=id=>document.getElementById(id);
const STORE="niyya_ai_v1";
const defaults={profile:{prenom:"",ville:"",metier:"",aime:[],naime_pas:[],faits:[]},resume:"",history:[],images:[],stats:{sessions:1}};
let data;try{data={...defaults,...JSON.parse(localStorage.getItem(STORE)||"{}")};data.profile={...defaults.profile,...(data.profile||{})};}catch{data=structuredClone(defaults)}
let cfg=JSON.parse(localStorage.getItem("niyya_cfg")||"{}"),busy=false;
$("apiUrl").value=cfg.url||"";$("model").value=cfg.model||"";$("apiKey").value=cfg.key||"";$("nickname").value=data.profile.prenom||"";
function persist(){localStorage.setItem(STORE,JSON.stringify(data))}
function add(role,text,extra){$("welcome").style.display="none";$("quick").style.display="none";const d=document.createElement("div");d.className="msg "+(role==="user"?"user":"bot");d.textContent=text;if(extra){const im=document.createElement("img");im.src=extra;im.alt="Image générée";d.appendChild(im)}$("messages").appendChild(d);$("main").scrollTop=$("main").scrollHeight;return d}
function norm(s){return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[’‘`´]/g,"'").trim()}
function dateFr(){return new Intl.DateTimeFormat("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(new Date())}
function memoryText(){let p=data.profile;return `Prénom : ${p.prenom||"non renseigné"}\nVille : ${p.ville||"non renseignée"}\nMétier : ${p.metier||"non renseigné"}\nFaits retenus : ${(p.faits||[]).join("; ")||"aucun"}\nAime : ${(p.aime||[]).join(", ")||"non renseigné"}\nN'aime pas : ${(p.naime_pas||[]).join(", ")||"non renseigné"}\nRésumé : ${data.resume||"aucun"}`}
function image(prompt){const clean=prompt.trim();data.images.unshift({prompt:clean,date:new Date().toISOString()});data.images=data.images.slice(0,30);persist();const url="https://image.pollinations.ai/prompt/"+encodeURIComponent(clean)+"?width=1024&height=1024&seed="+Math.floor(Math.random()*999999);add("bot","Je prépare ton image. Si elle ne s’affiche pas, ouvre le lien dans Safari : "+url,url);return true}
function command(s){let n=norm(s),m;
if(/^(stop|quitter|exit|au revoir|bye)$/.test(n))return "À bientôt ! Tu peux revenir discuter quand tu veux.";
if(/^(aide|help|commandes)$/.test(n))return "Voici mes commandes :\n• « Je m'appelle … » : enregistrer ton prénom\n• « Retiens que … » : mémoriser une information\n• « Oublie … » : retirer un souvenir\n• « Mémoire » : voir les informations retenues\n• « Nouvelle conversation » : effacer l’historique\n• « Dessine … » : créer une image\n• « Quelle heure est-il ? » / « Date »\n• « Calcule 12*7 »";
if(/^(memoire|mes infos|mon profil|que sais-tu de moi)$/.test(n))return memoryText();
if((m=n.match(/^(?:je m'appelle|je me nomme|mon prenom est|appelle-moi)\s+(.+)$/))) {data.profile.prenom=m[1].trim().slice(0,60);persist();return "Enchanté ! Je retiens que tu t'appelles "+data.profile.prenom+"."}
if((m=n.match(/^(?:retiens|souviens-toi|rappelle-toi|n'oublie pas)(?: bien)?(?: que|:)?\s*(.+)$/))){let f=m[1].trim();if(f&&!data.profile.faits.includes(f)){data.profile.faits.push(f);data.profile.faits=data.profile.faits.slice(-40)}persist();return "C'est retenu : "+f}
if((m=n.match(/^oublie\s+(.+)$/))){let f=m[1];if(/tout/.test(f)){data.profile=structuredClone(defaults.profile);data.resume="";data.history=[];persist();return "J'ai effacé les souvenirs et l'historique enregistrés dans cette application."}data.profile.faits=data.profile.faits.filter(x=>!norm(x).includes(f));persist();return "J'ai retiré le souvenir correspondant, s'il était présent."}
if(/^(nouvelle conversation|reset|efface l'historique)$/.test(n)){data.history=[];data.resume="";persist();$("messages").innerHTML="";return "Nouvelle conversation commencée."}
if(/^(quelle heure|quelle heure est-il|heure|l'heure)$/.test(n))return "Il est "+new Intl.DateTimeFormat("fr-FR",{hour:"2-digit",minute:"2-digit"}).format(new Date())+".";
if(/^(date|la date|quel jour sommes-nous|quelle est la date)$/.test(n))return "Nous sommes "+dateFr()+".";
if((m=n.match(/^(?:calcule|calcul|combien font|combien fait)\s+(.+)$/))){let expr=m[1].replace(/,/g,".").replace(/×/g,"*").replace(/÷/g,"/").replace(/\^/g,"**");if(!/^[\d\s.+\-*/()%*]+$/.test(expr))return "Je ne peux calculer que des expressions mathématiques simples.";try{let v=Function('"use strict";return ('+expr+')')();return Number.isFinite(v)?"Résultat : "+v:"Calcul impossible."}catch{return "Je n'arrive pas à interpréter ce calcul."}}
if((m=n.match(/^(?:dessine(?:-moi)?|image de|genere une image de|cree une image de)\s+(.+)$/))) {image(m[1]);return null}
if(/^(mes images|galerie)$/.test(n))return data.images.length? "Tes derniers sujets d’images :\n"+data.images.map((x,i)=>(i+1)+". "+x.prompt).join("\n"):"Tu n'as pas encore créé d'image.";
return undefined}
const system=`Tu es NIYYA AI, assistant personnel chaleureux, curieux, drôle avec humour bienveillant. Tu réponds en français naturel en tutoyant. Réponses courtes par défaut (2 à 5 phrases), honnêtes, sans inventer. Tu n'as pas nécessairement accès à l'actualité. Utilise la mémoire seulement si pertinent.\nMémoire utilisateur :\n${memoryText()}`;
async function ask(text){if(busy)return;busy=true;$("send").disabled=true;add("user",text);const cmd=command(text);if(cmd!==undefined){if(cmd!==null)add("bot",cmd);data.history.push({role:"user",content:text},{role:"assistant",content:cmd||"Image demandée"});data.history=data.history.slice(-16);persist();busy=false;$("send").disabled=false;return}
const wait=add("bot","NIYYA AI réfléchit…");wait.classList.add("typing");
const messages=[{role:"system",content:system},...data.history.slice(-12),{role:"user",content:text}];
let endpoints=[];if(cfg.url)endpoints.push({url:cfg.url,model:cfg.model||"default",key:cfg.key});endpoints.push({url:"https://text.pollinations.ai/openai",model:"openai",key:""});
let answer="";
for(const ep of endpoints){try{const r=await fetch(ep.url,{method:"POST",headers:{"Content-Type":"application/json",...(ep.key?{Authorization:"Bearer "+ep.key}:{})},body:JSON.stringify({model:ep.model,messages,temperature:.7})});if(!r.ok)throw Error("HTTP "+r.status);const j=await r.json();answer=j.choices?.[0]?.message?.content||j.choices?.[0]?.text||"";if(answer)break}catch(e){console.warn("Fournisseur indisponible",e)}}
wait.remove();if(!answer)answer="Je n'arrive pas à joindre mon service IA pour le moment. Vérifie ta connexion ou configure une API compatible OpenAI dans ⚙️. Les commandes de mémoire, calcul, date et images restent disponibles.";
add("bot",answer);data.history.push({role:"user",content:text},{role:"assistant",content:answer});data.history=data.history.slice(-16);persist();busy=false;$("send").disabled=false}
$("send").onclick=()=>{let t=$("prompt").value.trim();if(!t)return;$("prompt").value="";$("prompt").style.height="42px";ask(t)};
$("prompt").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("send").click()}});$("prompt").addEventListener("input",e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,130)+"px"});
document.querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>ask(b.dataset.q));
$("settings").onclick=()=>$("overlay").style.display="flex";$("close").onclick=()=>$("overlay").style.display="none";
$("save").onclick=()=>{cfg={url:$("apiUrl").value.trim(),model:$("model").value.trim(),key:$("apiKey").value.trim()};localStorage.setItem("niyya_cfg",JSON.stringify(cfg));data.profile.prenom=$("nickname").value.trim();persist();$("settingsStatus").textContent="Réglages enregistrés sur cet appareil."};
$("export").onclick=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="niyya-memoire.json";a.click();URL.revokeObjectURL(a.href)};
$("clear").onclick=()=>{if(confirm("Effacer les messages affichés et l'historique ?")){data.history=[];persist();$("messages").innerHTML="";$("settingsStatus").textContent="Historique effacé."}};
if("serviceWorker" in navigator && location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js").catch(console.warn);
