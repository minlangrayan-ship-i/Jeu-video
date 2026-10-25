import './style.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/dm-sans/latin-700.css';
import '@fontsource/dm-serif-display/latin-400.css';
import '@fontsource/dm-serif-display/latin-400-italic.css';
import { HarbourWorld } from './world.js';
import { DAYS, PLACES, WEATHER, ACTIVITIES, dateFor, getDay, weekFor } from './content.js';
import { readState, saveState, eraseState, progress } from './state.js';

const paths = {
 arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
 close: '<path d="m6 6 12 12M6 18 18 6"/>',
 home: '<path d="m3 10 9-7 9 7v10H3zM9 20v-7h6v7"/>',
 cup: '<path d="M4 7h12v7a6 6 0 0 1-12 0zM16 8h2a3 3 0 0 1 0 6h-2M4 21h14M7 2v2m5-2v2"/>',
 bag: '<path d="M4 7h16l-1 14H5zM8 8V6a4 4 0 0 1 8 0v2"/>',
 work: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3M3 12a22 22 0 0 0 18 0M10 13h4"/>',
 tree: '<path d="m12 2-6 8h3l-5 7h7v5h2v-5h7l-5-7h3z"/>',
 book: '<path d="M12 5c-3-3-8-2-10-1v15c3-2 7-2 10 0 3-2 7-2 10 0V4c-3-1-7-2-10 1zm0 0v14"/>',
 map: '<path d="m3 5 6-3 6 3 6-3v17l-6 3-6-3-6 3zm6-3v17m6-14v17"/>',
 calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 2v6m10-6v6M3 11h18m-13 5h1m5 0h1"/>',
 sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>',
 cloud: '<path d="M6 19a5 5 0 0 1-1-10 7 7 0 0 1 13-2 6 6 0 0 1 0 12z"/>',
 rain: '<path d="M6 15a4 4 0 0 1-1-8 6 6 0 0 1 11-2 5 5 0 0 1 2 10M7 18l-1 3m7-3-1 3m7-3-1 3"/>',
 check: '<path d="m5 12 4 4L20 5"/>',
 pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="2.5"/>',
 sound: '<path d="m3 9 5 0 5-5v16l-5-5H3zm13-2a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16"/>',
 mute: '<path d="m3 9 5 0 5-5v16l-5-5H3zm13 0 6 6m0-6-6 6"/>',
 mic: '<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/>',
 settings: '<path d="m9 3-1 3-3 1-2 5 2 5 3 1 1 3h6l1-3 3-1 2-5-2-5-3-1-1-3z"/><circle cx="12" cy="12" r="3"/>',
 plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
 star: '<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>',
 heart: '<path d="M20 5c-3-3-6-1-8 1C6-1-3 8 12 21 27 8 23 2 20 5z"/>',
 help: '<circle cx="12" cy="12" r="10"/><path d="M9 8a3 3 0 0 1 6 0c0 3-3 2-3 5m0 3v1"/>',
 lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
 download: '<path d="M12 3v12m-5-5 5 5 5-5M4 15v6h16v-6"/>',
 leaf: '<path d="M20 3C7 1 1 10 6 17s16 2 14-14ZM5 20 16 9"/>',
 chat: '<path d="M21 11a9 9 0 0 1-9 9H4l-2 2V11a9 9 0 0 1 19 0zM7 10h10m-10 4h6"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.star}</svg>`;
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const placeIcon = id => ({ home: 'home', cafe: 'cup', market: 'bag', work: 'work', park: 'tree', books: 'book' })[id];
let state = readState();
let world;
let activeScene;
let activePlace;
let conversationMode = 'choose';
let recognition;
let toastTimeout;
let savedOkay = true;
let dialogMode;
let mapIsOpen = false;
const currentDay = () => getDay(state.day);
const currentScene = () => currentDay().scenes[state.scene];
const answerFor = scene => scene.id === '1-0' ? scene.answer.replace('Charlie', state.name || 'Charlie') : scene.answer;
const persist = () => {
  savedOkay = saveState(state);
  if (!savedOkay) toast('La sauvegarde locale est indisponible. Vous pouvez exporter votre progression dans les réglages.');
};

function portrait(type = 'charlie', cls = '') {
  const colors = type === 'charlie' ? ['#cf744a','#3a6b60','#f3c36d'] : type === 'R' ? ['#754935','#b76e50','#f4dbae'] : ['#64523e','#73938a','#d7b482'];
  return `<svg class="portrait ${cls}" viewBox="0 0 160 180" fill="none" aria-hidden="true"><ellipse cx="80" cy="172" rx="58" ry="9" fill="#214f40" opacity=".12"/><path d="M26 179v-31c0-29 24-42 54-42s54 13 54 42v31" fill="${colors[1]}"/><path d="m61 111 19 19 20-19v-20H61z" fill="#dfa57d"/><path d="M46 52c0-46 72-46 72 0v30c0 46-72 46-72 0z" fill="#efbd96"/><ellipse cx="44" cy="77" rx="8" ry="11" fill="#efbd96"/><ellipse cx="119" cy="77" rx="8" ry="11" fill="#efbd96"/><path d="M46 67c-15-15-9-48 15-48 1-18 28-19 35-9 20-3 34 13 28 27 14 18 0 35-8 35l-5-26c-18 8-29 4-37-4-9 13-17 16-28 14z" fill="${colors[0]}"/><circle cx="65" cy="74" r="3" fill="#3c4035"/><circle cx="97" cy="74" r="3" fill="#3c4035"/><path d="M74 94q8 7 16-1" stroke="#9d654e" stroke-width="3" stroke-linecap="round"/><path d="m53 113 27 13 27-13 6 15-32 16-34-16z" fill="${colors[2]}"/><path d="m60 136-5 36 17 3 8-34" fill="${colors[2]}"/><path d="M33 148h9v31h-9m79-39h10v39h-10" fill="#e3ac67"/></svg>`;
}

document.querySelector('#app').innerHTML = `
  <main class="game-shell">
    <canvas id="world" aria-label="Quartier 3D de Harbour. Déplacez-vous avec les flèches, ZQSD ou WASD, ou touchez le sol."></canvas>
    <div class="world-vignette" aria-hidden="true"></div>
    <header class="topbar">
      <a class="brand" href="#" data-action="home"><span class="brand-mark">h<span>.</span></span><span>Hello, Harbour<small>A LITTLE WORLD. A LITTLE MORE YOU.</small></span></a>
      <nav class="desktop-nav" aria-label="Navigation principale">
        <button class="nav-item active" data-action="explore">${icon('map')}<span>Le quartier</span></button>
        <button class="nav-item" data-action="journey">${icon('calendar')}<span>Les 30 jours</span></button>
        <button class="nav-item" data-action="notebook">${icon('book')}<span>Mon carnet</span></button>
      </nav>
      <div class="header-actions"><span class="local-save" title="Sauvegarde sur cet appareil">${icon('check')}<span>Local save</span></span><button class="icon-button settings-button" data-action="settings" aria-label="Réglages">${icon('settings')}</button><button class="user-avatar" data-action="profile" aria-label="Votre personnage">${portrait()}</button></div>
    </header>
    <aside id="daily-panel" class="daily-panel" aria-label="Votre journée"></aside>
    <aside id="weather" class="weather-card" aria-label="Date et météo du jeu"></aside>
    <div class="town-label"><span class="little-line"></span><span>HARBOUR, ENGLAND</span><span class="little-line"></span></div>
    <div id="nearby" class="nearby-card"></div>
    <div class="world-controls"><button class="icon-button" data-action="zoom-in" aria-label="Rapprocher la caméra">${icon('plus')}</button><button class="icon-button" data-action="zoom-out" aria-label="Éloigner la caméra">${icon('minus')}</button><span></span><button class="icon-button" data-action="sound" id="sound-button" aria-label="Couper la voix">${icon('sound')}</button><button class="icon-button" data-action="help" aria-label="Comment jouer">${icon('help')}</button></div>
    <div class="map-wrap" id="minimap"></div>
    <div class="bottom-caption"><span class="live-dot"></span> Your own little corner of England.<span class="caption-right">Explore. Connect. Become.</span></div>
    <div class="joystick" id="joystick" role="group" aria-label="Joystick tactile pour marcher"><div class="joystick-knob"></div><span>WALK</span></div>
    <nav class="mobile-nav" aria-label="Navigation mobile"><button data-action="explore" class="active">${icon('map')}<span>Explorer</span></button><button data-action="journey">${icon('calendar')}<span>30 jours</span></button><button data-action="tasks">${icon('check')}<span>Ma journée</span></button><button data-action="notebook">${icon('book')}<span>Carnet</span></button></nav>
    <div id="toast" class="toast" role="status" aria-live="polite"></div>
    <div id="world-status" class="sr-only" aria-live="polite"></div>
    <dialog id="modal" aria-label="Hello Harbour"></dialog>
  </main>`;

const modal = document.querySelector('#modal');

function toast(message) {
  const el = document.querySelector('#toast'); el.textContent = message; el.classList.add('show');
  clearTimeout(toastTimeout); toastTimeout = setTimeout(() => el.classList.remove('show'), 4800);
}
function openDialog(mode, content, cls = '') {
  stopListening(); window.speechSynthesis?.cancel();
  dialogMode = mode;
  modal.className = cls;
  modal.innerHTML = content;
  if (!modal.open) modal.showModal();
  if (world) { world.paused = true; world.keys.clear(); world.stick = {x:0,z:0}; }
  modal.scrollTop = 0;
}
function closeDialog() {
  stopListening(); window.speechSynthesis?.cancel(); modal.close(); dialogMode = null;
  if (world) world.paused = false;
}
modal.addEventListener('cancel', e => { if (dialogMode === 'welcome') { e.preventDefault(); return; } closeDialog(); });
modal.addEventListener('close', () => { if (world) world.paused = false; });
const closeButton = () => `<button class="icon-button close-dialog" data-action="close" aria-label="Fermer">${icon('close')}</button>`;

function renderHUD() {
  const day = currentDay(), scene = currentScene(), stats = progress(state);
  const complete = day.scenes.every(s => state.completed.includes(s.id));
  const doneToday = day.scenes.filter(s => state.completed.includes(s.id)).length;
  document.querySelector('#daily-panel').innerHTML = `
    <div class="panel-eyebrow"><span class="live-dot"></span> YOUR NEXT CHAPTER <span class="day-counter">${String(state.day).padStart(2,'0')}<span>/30</span></span></div>
    <h1>${state.day === 1 ? 'Make yourself<br><em>at home.</em>' : escape(day.title) + '<span class="heading-dot">.</span>'}</h1>
    <p class="panel-intro">${escape(day.subtitle)}<br><span>Une journée, trois petits pas.</span></p>
    <div class="day-progress"><span>DAY ${String(state.day).padStart(2,'0')} <span>· WEEK ${weekFor(state.day)}</span></span><strong>${doneToday}<span> / 3</span></strong></div>
    <div class="progress-track"><span style="width:${doneToday/3*100}%"></span></div>
    <div class="task-list">${day.scenes.map((s,i) => `<button class="task ${state.completed.includes(s.id)?'done':i===state.scene?'current':'later'}" data-action="task" data-index="${i}" ${i>state.scene&&!state.completed.includes(s.id)?'aria-disabled="true"':''}><span class="task-icon">${icon(state.completed.includes(s.id)?'check':placeIcon(s.place))}</span><span class="task-copy"><small>${s.period.toUpperCase()} <span>${s.time}</span></small><strong>${PLACES[s.place].label}</strong><span>${escape(s.goal)}</span></span>${i===state.scene&&!complete?'<span class="task-dot"></span>':''}</button>`).join('')}</div>
    <button class="primary-button route-button" data-action="${complete?'day-summary':'travel'}">${complete?'Votre bilan du jour':`Rejoindre ${PLACES[scene.place].npc}`} ${icon('arrow')}</button>
    <div class="panel-footer">${icon('leaf')} <span>${stats.completed === 0 ? 'Every little conversation counts.' : `${stats.completed} moments vécus. Keep going!`}</span></div>`;
  const weather = WEATHER[day.weather];
  document.querySelector('#weather').innerHTML = `<div class="weather-date">${dateFor(day.id).toUpperCase()}<span class="fiction-label">TEMPS DU JEU</span></div><div class="weather-main"><div><strong>${scene.time}</strong><span>${weather.label}</span></div><span class="weather-symbol">${icon(weather.icon)}</span><span class="temperature">${day.temperature}°</span></div><div class="weather-bottom"><span>${icon('pin')} Harbour, UK</span><span>Week ${weekFor(day.id)}</span></div>`;
  document.querySelector('#sound-button').innerHTML = icon(state.sound ? 'sound':'mute');
  document.querySelector('#sound-button').setAttribute('aria-label',state.sound?'Couper la voix':'Activer la voix');
  if (world) { world.setDay(day,state.scene); world.setMission(scene.place); world.reducedMotion=state.reducedMotion; }
  renderMinimap();
}

function renderMinimap() {
  const el = document.querySelector('#minimap');
  el.innerHTML = `<button class="minimap-toggle" data-action="map" aria-expanded="${mapIsOpen}" aria-label="${mapIsOpen?'Fermer':'Ouvrir'} le plan">${icon('map')}<span>LE QUARTIER</span></button><div class="minimap-content ${mapIsOpen?'expanded':''}"><svg viewBox="0 0 160 150" role="img" aria-label="Plan de Harbour"><rect width="160" height="150" rx="16" fill="#ced6b7"/><path d="M0 0h17v150H0" fill="#99bcba"/><path d="M17 74h143M87 0v150" stroke="#eee8cc" stroke-width="13"/><path d="M17 74h143M87 0v150" stroke="#8ea195" stroke-width="7"/>${Object.entries(PLACES).map(([id,p])=>`<g data-action="place" data-place="${id}" role="button" tabindex="0" aria-label="Aller à ${escape(p.label)}"><rect x="${87+p.x*2.5-8}" y="${74+p.z*2.6-7}" width="16" height="14" rx="3" fill="${id===currentScene().place?'#df965b':p.color}" stroke="#f8f0d6" stroke-width="2"/><circle cx="${87+p.x*2.5}" cy="${74+p.z*2.6}" r="13" fill="transparent"/></g>`).join('')}<circle id="map-player" cx="57" cy="111" r="4.5" fill="#214f43" stroke="#fff7e1" stroke-width="2"/></svg><span>TOUCHEZ UN LIEU POUR Y ALLER</span></div>`;
}

function welcome() {
  openDialog('welcome', `<div class="welcome-art"><span class="eyebrow">MEET YOUR NEW CHAPTER</span><div class="welcome-sun"></div><div class="art-window"><i></i><i></i><i></i><i></i></div>${portrait('charlie','welcome-person')}<span class="hello-bubble">Hello, you.</span><div class="art-postcard">A little courage.<br>A whole new world.<span>HARBOUR · ENGLAND</span></div></div><div class="welcome-content"><span class="eyebrow">30 DAYS. COUNTLESS POSSIBILITIES.</span><h2>Une nouvelle vie.<br><em>In English.</em></h2><p>Posez vos valises dans un petit quartier anglais. Rencontrez vos voisins, trouvez vos habitudes et osez vos premières conversations.</p><label class="field-label" for="player-name">Comment vous appelle-t-on ?</label><input id="player-name" name="name" maxlength="24" value="${escape(state.name)}" autocomplete="off" placeholder="Votre prénom ou un pseudonyme"/><div class="welcome-features"><span>${icon('map')} Un monde en 3D</span><span>${icon('chat')} Texte & voix</span><span>${icon('lock')} Sans compte</span></div><button class="primary-button" data-action="start">Entrer dans Harbour ${icon('arrow')}</button><small class="privacy-hint">Votre progression reste sur cet appareil. Le micro est facultatif. Aucune IA payante n’est nécessaire.</small></div>`, 'welcome-dialog');
}

function travel(place = currentScene().place) {
  closeDialog(); document.querySelector('#daily-panel').classList.remove('mobile-open');
  if (!world) { openConversation(place); return; }
  activePlace = place;
  const arrive = () => { document.querySelector('#world-status').textContent = `Vous êtes à ${PLACES[place].label}.`; openConversation(place); };
  if (world.distanceTo(place)<2.2) arrive();
  else if (world.goTo(place,arrive)) toast(`En route vers ${PLACES[place].name}… Vous pouvez aussi marcher avec les flèches.`);
}

function openConversation(place, replayScene) {
  activePlace = place;
  activeScene = replayScene || (currentScene().place === place ? currentScene() : null);
  conversationMode = 'choose';
  if (!activeScene) {
    const p = PLACES[place];
    openDialog('chat', `${closeButton()}<div class="npc-header"><span class="npc-avatar" style="background:${p.tone}">${portrait(p.avatar)}</span><div><span class="eyebrow">${p.name.toUpperCase()}</span><h2>${p.npc}</h2><p>${p.role}</p></div></div><div class="speech-bubble">${escape({home:'Make yourself at home! We can catch up later.',cafe:'Lovely to see you! Pop back when you fancy a chat.',market:'Morning! Have a look around.',work:'Hello! Good to see you around the studio.',park:'A little fresh air does wonders, doesn’t it?',books:'There’s always another story waiting for you.'}[place])}</div><p class="muted">Votre prochaine situation se passe à ${PLACES[currentScene().place].label.toLowerCase()}. Vous pouvez explorer librement entre les conversations.</p><button class="primary-button" data-action="travel">Continuer ma journée ${icon('arrow')}</button>`, 'conversation-dialog');
    return;
  }
  renderConversation();
}

function renderConversation() {
  const s=activeScene,p=PLACES[s.place];
  // A deterministic permutation avoids teaching a fixed answer position.
  const options = [answerFor(s),...s.wrong].map((text,i)=>({text,correct:i===0}));
  const shift=(Number(s.id.split('-')[0])+Number(s.id.split('-')[1]))%3;
  const answers=[...options.slice(shift),...options.slice(0,shift)];
  openDialog('conversation', `${closeButton()}<div class="conversation-meta"><span class="eyebrow">DAY ${s.id.split('-')[0]} · ${s.period.toUpperCase()}</span><span class="practice-tag">${state.completed.includes(s.id)?'REPLAY':'LET’S TALK'}</span></div><div class="npc-header"><span class="npc-avatar" style="background:${p.tone}">${portrait(p.avatar)}</span><div><h2>${p.npc}</h2><p>${p.role}</p></div></div><div class="speech-bubble"><p>${escape(s.prompt)}</p><button class="listen-button" data-action="listen" aria-label="Écouter la phrase">${icon('sound')} Écouter</button></div><p class="conversation-goal">${icon('pin')} ${escape(s.goal)}</p><div class="mode-tabs" role="group" aria-label="Mode de réponse"><button class="${conversationMode==='choose'?'active':''}" data-action="mode" data-mode="choose">Choisir</button><button class="${conversationMode==='write'?'active':''}" data-action="mode" data-mode="write">Écrire</button><button class="${conversationMode==='speak'?'active':''}" data-action="mode" data-mode="speak">${icon('mic')} Parler</button></div><div id="answer-area">${conversationMode==='choose'?`<div class="answer-options">${answers.map((a,i)=>`<button class="answer-option" data-action="answer" data-correct="${a.correct}"><span>${String.fromCharCode(65+i)}</span>${escape(a.text)}${icon('arrow')}</button>`).join('')}</div>`:conversationMode==='write'?`<label class="field-label" for="practice-text">Your turn. Comment répondriez-vous ?</label><textarea id="practice-text" rows="3" maxlength="400" placeholder="Write your reply in English…" spellcheck="true" lang="en-GB"></textarea><button class="primary-button" data-action="compare">Comparer avec un exemple ${icon('arrow')}</button><p class="practice-note">Entraînement libre : votre texte n’est ni envoyé à une IA ni conservé. La comparaison ne constitue pas une évaluation.</p>`:`<div class="voice-practice"><button class="record-button" data-action="record" aria-label="Commencer la dictée vocale">${icon('mic')}</button><strong id="voice-label">Osez le dire à voix haute.</strong><p>Activez la dictée pour voir vos mots, puis comparez-les à un exemple.</p><textarea id="practice-text" rows="2" maxlength="400" placeholder="Votre transcription apparaîtra ici…" aria-label="Transcription modifiable de votre réponse" lang="en-GB"></textarea><button class="primary-button" data-action="compare">Comparer ma réponse ${icon('arrow')}</button><small>La dictée dépend du navigateur et peut transmettre l’audio à son fournisseur. Rien n’est enregistré par le jeu. Aucun score de prononciation.</small></div>`}</div><div id="answer-feedback" aria-live="polite"></div><div class="conversation-footer"><button class="text-button" data-action="hint">${icon('help')} Un coup de pouce</button><button class="text-button" data-action="save-phrase">${icon('book')} ${state.saved.includes(s.id)?'Dans le carnet':'Garder la phrase'}</button></div>`, 'conversation-dialog');
}

function chooseAnswer(button) {
  const s=activeScene;
  const alreadyDone=state.completed.includes(s.id);
  state.attempts[s.id]=Math.min(100,(Number(state.attempts[s.id])||0)+1);
  const correct=button.dataset.correct==='true';
  const feedback=document.querySelector('#answer-feedback');
  if(!correct) {
    button.classList.add('wrong'); button.disabled=true;
    feedback.innerHTML=`<div class="feedback try-again"><strong>Try another way.</strong><p>Cette réponse ne correspond pas à votre objectif : ${escape(s.goal.toLowerCase())}</p><button class="text-button" data-action="hint">Voir un indice</button></div>`;
    persist(); return;
  }
  button.classList.add('correct');
  document.querySelectorAll('.answer-option').forEach(b=>b.disabled=true);
  if(!alreadyDone) {
    state.completed.push(s.id);
    if(state.attempts[s.id]===1) state.firstTry.push(s.id);
  }
  persist(); renderHUD();
  feedback.innerHTML=`<div class="feedback success"><span class="feedback-title">${icon('check')} You’ve got it!</span><p>${escape(s.tip)}</p><button class="primary-button" data-action="continue">${alreadyDone?'Terminer la révision':'Continuer ma journée'} ${icon('arrow')}</button></div>`;
  feedback.scrollIntoView({block:'nearest',behavior:state.reducedMotion?'instant':'smooth'});
}

function compareAnswer() {
  const text=document.querySelector('#practice-text').value.trim();
  if(!text) { toast('Écrivez ou dictez une réponse avant de comparer.'); return; }
  stopListening();
  document.querySelector('#answer-feedback').innerHTML=`<div class="feedback practice-feedback"><strong>One way to say it</strong><blockquote>${escape(answerFor(activeScene))}</blockquote><p>${escape(activeScene.tip)}</p><p class="practice-note">Votre réponse peut aussi convenir. Comparez le sens et la formulation ; cet exercice libre n’attribue aucun score.</p><button class="primary-button" data-action="guided">Vérifier avec le défi guidé ${icon('arrow')}</button></div>`;
  document.querySelector('#answer-feedback').scrollIntoView({block:'nearest',behavior:'smooth'});
}

function continueDay() {
  const s=activeScene;
  if(s.id!==currentScene().id) { closeDialog(); return; }
  if(state.scene<2) { state.scene++; persist(); renderHUD(); closeDialog(); toast(`Next stop: ${PLACES[currentScene().place].name}. Prenez le temps d’explorer !`); }
  else daySummary();
}

function daySummary() {
  const day=currentDay(), done=day.scenes.filter(s=>state.completed.includes(s.id)).length;
  if(done<3) { toast('Vivez les trois moments de la journée pour découvrir votre bilan.'); return; }
  const first=day.scenes.filter(s=>state.firstTry.includes(s.id)).length;
  openDialog('summary', `${closeButton()}<div class="summary-sticker">${icon(state.day===30?'star':'sun')}</div><span class="eyebrow">DAY ${state.day} · THAT’S A WRAP</span><h2>${state.day===30?'Your next chapter<br><em>starts here.</em>':'Look how far<br><em>you’ve come.</em>'}</h2><p>${state.day===30?'Vous avez vécu les 90 situations de Harbour. Vous pouvez revenir sur chaque journée pour pratiquer à nouveau.':'Trois conversations de plus dans votre nouvelle vie. Prenez un instant pour retenir quelque chose.'}</p><div class="summary-stats"><div><strong>3</strong><span>moments vécus</span></div><div><strong>${first}/3</strong><span>réussis au 1er essai</span></div></div><label class="field-label" for="reflection">Une chose que vous retenez ? <span>Facultatif · sur cet appareil</span></label><textarea id="reflection" rows="2" maxlength="200" placeholder="Today I learned…"></textarea><p class="practice-note">Le score concerne les choix guidés, pas votre niveau global d’anglais.</p><button class="primary-button" data-action="next-day">${state.day===30?'Explorer mon parcours':'Passer au jour '+(state.day+1)} ${icon('arrow')}</button>`, 'summary-dialog');
}

function nextDay() {
  const note=document.querySelector('#reflection')?.value.trim();
  if(note) { state.notes=state.notes.filter(n=>n.day!==state.day); state.notes.push({day:state.day,text:note}); }
  if(state.day===30) {persist();journey();return;}
  state.day++; state.scene=0; persist(); renderHUD();closeDialog();
  toast(`Day ${state.day} · ${currentDay().title}. ${WEATHER[currentDay().weather].french} aujourd’hui.`);
}

function journey() {
  const stats=progress(state);
  openDialog('journey',`${closeButton()}<span class="eyebrow">YOUR STORY, ONE DAY AT A TIME</span><h2>Les petits pas font<br><em>les grands voyages.</em></h2><p>Trente journées pour prendre votre place à Harbour. Rejouez les journées ouvertes aussi souvent que vous le souhaitez.</p><div class="journey-stats"><span><strong>${stats.days}</strong> jours terminés</span><span><strong>${stats.completed}</strong> conversations / 90</span><span><strong>${stats.percent}%</strong> du parcours</span></div><div class="journey-grid">${DAYS.map(d=>{const done=d.scenes.every(s=>state.completed.includes(s.id));const available=d.id<=state.day;return `<button class="journey-day ${done?'complete':''} ${d.id===state.day?'today':''}" data-action="select-day" data-day="${d.id}" ${available?'':'disabled'}><span class="journey-day-number">${done?icon('check'):String(d.id).padStart(2,'0')}</span><span class="journey-day-copy"><strong>${escape(d.title)}</strong><small>${escape(d.subtitle)}</small></span><span class="journey-day-weather">${icon(available?WEATHER[d.weather].icon:'lock')}</span></button>`}).join('')}</div>`, 'journey-dialog');
}

function notebook() {
  const stats=progress(state);
  const weeks=[1,2,3,4,5].map(w=>{const ids=state.completed.filter(id=>weekFor(Number(id.split('-')[0]))===w);return {w,total:ids.length,first:ids.filter(id=>state.firstTry.includes(id)).length};});
  openDialog('notebook',`${closeButton()}<span class="eyebrow">A LITTLE MORE CONFIDENT, EVERY DAY</span><h2>Votre anglais.<br><em>Votre histoire.</em></h2><p>Des traces de votre parcours, conservées sur cet appareil.</p><div class="notebook-tabs"><span>${icon('chat')} ${stats.completed} situations vécues</span><span>${icon('star')} ${stats.firstTry} au premier essai</span></div><section class="notebook-section"><h3>Vos choix guidés, semaine après semaine</h3><p class="muted">Part des situations réussies dès le premier essai. Ce repère ne mesure ni votre niveau CECRL ni votre prononciation.</p><div class="week-bars">${weeks.map(w=>`<div class="week-bar"><span>S${w.w}</span><div><i style="width:${w.total?w.first/w.total*100:0}%"></i></div><strong>${w.total?Math.round(w.first/w.total*100)+'%':'—'}</strong><small>${w.total} situations</small></div>`).join('')}</div></section><section class="notebook-section"><div class="section-title"><h3>Les phrases à emporter</h3><span>${state.saved.length}</span></div>${state.saved.length?state.saved.map(id=>{const s=DAYS.flatMap(d=>d.scenes).find(s=>s.id===id);return s?`<article class="saved-phrase"><span class="eyebrow">DAY ${id.split('-')[0]} · ${PLACES[s.place].name}</span><p>“${escape(answerFor(s))}”</p><div><button class="text-button" data-action="listen-saved" data-id="${id}">${icon('sound')} Écouter</button><button class="text-button" data-action="remove-phrase" data-id="${id}">Retirer</button></div></article>`:'';}).join(''):`<div class="empty-state">${icon('book')}<p>Une expression vous plaît ?<br>Gardez-la pendant une conversation.</p></div>`}</section><section class="notebook-section"><h3>Votre journal de bord</h3>${state.notes.length?state.notes.map(n=>`<article class="journal-note"><span>DAY ${n.day}</span><p>${escape(n.text)}</p></article>`).join(''):'<p class="muted">À la fin d’une journée, notez ce que vous souhaitez retenir.</p>'}</section>`, 'notebook-dialog');
}

function settings() {
  openDialog('settings',`${closeButton()}<span class="eyebrow">MAKE YOURSELF COMFORTABLE</span><h2>À votre rythme.</h2><label class="field-label" for="settings-name">Votre prénom ou pseudonyme</label><input id="settings-name" maxlength="24" autocomplete="off" value="${escape(state.name)}"/><label class="toggle-row"><span><strong>Voix des personnages</strong><small>Synthèse vocale du navigateur, si disponible.</small></span><input type="checkbox" id="setting-sound" ${state.sound?'checked':''}/></label><label class="toggle-row"><span><strong>Réduire les animations</strong><small>Limite les mouvements décoratifs.</small></span><input type="checkbox" id="setting-motion" ${state.reducedMotion?'checked':''}/></label><div class="privacy-box">${icon('lock')}<div><strong>Une petite empreinte numérique.</strong><p>Sans compte, publicité ni outil de suivi. Progression et notes restent dans le stockage local. Aucun audio n’est conservé par le jeu. La dictée est facultative et peut utiliser les serveurs du fournisseur de votre navigateur. Évitez les informations personnelles dans vos notes et vos paroles.</p></div></div><button class="primary-button" data-action="save-settings">Enregistrer ${icon('check')}</button><div class="settings-bottom"><button class="text-button" data-action="export">${icon('download')} Exporter ma sauvegarde</button><button class="text-button danger" data-action="confirm-reset">Effacer ma progression</button></div><p class="practice-note">Le calendrier est fictif : trois moments font une journée. Le temps n’avance pas lorsque vous quittez le jeu. Les échanges sont scénarisés ; aucune IA générative n’est utilisée.</p>`, 'settings-dialog');
}

function help() {
  openDialog('help',`${closeButton()}<span class="eyebrow">A FEW LITTLE POINTERS</span><h2>Bienvenue<br><em>dans le quartier.</em></h2><div class="help-list"><div>${icon('map')}<span><strong>Promenez-vous</strong>Cliquez ou touchez le sol pour marcher. Sur ordinateur : flèches, ZQSD ou WASD. Sur mobile : joystick en bas à gauche.</span></div><div>${icon('pin')}<span><strong>Retrouvez vos voisins</strong>Le losange doré indique la prochaine situation. « Rejoindre » vous y conduit à pied ; les bâtiments et le plan sont aussi cliquables.</span></div><div>${icon('chat')}<span><strong>Osez les conversations</strong>Choisissez une réponse, écrivez ou dictez pour pratiquer. Le défi guidé valide la situation ; vous pouvez réessayer sans limite.</span></div><div>${icon('sun')}<span><strong>Vivez à votre rythme</strong>Matin, après-midi et soir : trois situations par journée. Comptez environ 5 à 10 minutes, davantage si vous explorez. Le calendrier du jeu est indépendant du temps réel.</span></div><div>${icon('book')}<span><strong>Revenez sur vos découvertes</strong>Gardez des phrases dans votre carnet et rejouez les journées déjà ouvertes. Votre progression est sauvegardée localement.</span></div></div><button class="primary-button" data-action="close">Let’s go ${icon('arrow')}</button>`, 'help-dialog');
}

function speak(text, slow = false) {
  if(!state.sound) {toast('Activez les voix avec le bouton haut-parleur.');return;}
  if(!('speechSynthesis' in window)) {toast('La lecture vocale n’est pas disponible dans ce navigateur. Le texte reste accessible.');return;}
  speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(text); utterance.lang='en-GB';utterance.rate=slow?0.7:0.88;
  const voices=speechSynthesis.getVoices(); const voice=voices.find(v=>v.lang==='en-GB') || voices.find(v=>v.lang.startsWith('en'));
  if(voice) utterance.voice=voice;
  utterance.onerror=e=>{if(!['interrupted','canceled'].includes(e.error))toast('La voix n’est pas disponible ici. Vous pouvez continuer avec le texte.');};
  speechSynthesis.speak(utterance);
}
function stopListening() { if(recognition) { recognition.onend=null;recognition.abort();recognition=null; } }
function startListening() {
  if(recognition) {stopListening();document.querySelector('#voice-label').textContent='Dictée arrêtée.';return;}
  const API=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!API) {toast('Ce navigateur ne propose pas la dictée. Écrivez votre réponse ou entraînez-vous à voix haute.');return;}
  recognition=new API();recognition.lang='en-GB';recognition.continuous=false;recognition.interimResults=true;
  recognition.onresult=e=>{const field=document.querySelector('#practice-text');if(field)field.value=Array.from(e.results).map(r=>r[0].transcript).join(' ').slice(0,400);};
  recognition.onstart=()=>{const label=document.querySelector('#voice-label');if(label)label.textContent='Listening… Speak in English.';document.querySelector('.record-button')?.classList.add('recording');};
  recognition.onend=()=>{recognition=null;const label=document.querySelector('#voice-label');if(label)label.textContent='À vous de comparer votre réponse.';document.querySelector('.record-button')?.classList.remove('recording');};
  recognition.onerror=e=>{toast(e.error==='not-allowed'?'Le micro n’est pas autorisé. La réponse écrite reste disponible.':'Dictée indisponible. Essayez à nouveau ou écrivez votre réponse.');};
  try {recognition.start();} catch {stopListening();toast('Impossible de lancer la dictée dans ce navigateur.');}
}

function showHint() {
  document.querySelector('#answer-feedback').innerHTML=`<div class="feedback hint-feedback"><strong>${icon('help')} A little help</strong><p>${escape(activeScene.tip)}</p><button class="text-button" data-action="listen-slow">${icon('sound')} Réécouter plus lentement</button></div>`;
}

function exportSave() {
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='hello-harbour-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  toast('Sauvegarde exportée. Elle peut contenir votre pseudonyme et vos notes.');
}

function everydayActivity(place) {
  activePlace=place;
  const activity=ACTIVITIES[place],done=state.activities.includes(`${state.day}:${place}`);
  openDialog('activity',`${closeButton()}<span class="eyebrow">THE EVERYDAY LITTLE THINGS · DAY ${state.day}</span><h2>${activity.title}<span class="heading-dot">.</span></h2><p>${activity.label} · ${PLACES[place].name}</p><div class="speech-bubble">${activity.prompt}</div><div class="answer-options">${activity.choices.map((c,i)=>`<button class="answer-option" data-action="do-activity" data-choice="${i}"><span>${String.fromCharCode(65+i)}</span>${escape(c)}${icon('arrow')}</button>`).join('')}</div><div class="activity-vocab"><span class="eyebrow">A LITTLE EXPRESSION TO KEEP</span><strong>${activity.phrase}</strong><p>${activity.meaning}</p></div><p class="practice-note">${done?'Vous avez déjà profité de cette activité aujourd’hui. Vous pouvez recommencer.':'Une activité libre pour habiter le quartier et lire de l’anglais en contexte. Aucun score.'}</p>`,'activity-dialog');
}

function performActivity(choiceIndex) {
  const place=activePlace,activity=ACTIVITIES[place];
  const choice=activity.choices[choiceIndex]||activity.choices[0];
  const execute=()=>{
    const key=`${state.day}:${place}`;
    if(!state.activities.includes(key))state.activities.push(key);
    persist();world?.performActivity(activity.pose);toast(`${choice}. ${activity.reply}`);
  };
  closeDialog();
  if(world&&world.distanceTo(place)>2.2)world.goTo(place,execute);else execute();
}

document.addEventListener('click', event => {
  const target=event.target.closest('[data-action]');if(!target || target.disabled)return;
  const action=target.dataset.action;
  if(target.tagName==='A')event.preventDefault();
  switch(action) {
    case 'start': state.name=document.querySelector('#player-name').value.trim()||'Charlie';state.started=true;persist();closeDialog();renderHUD();toast('Welcome home! Retrouvez Jamie à Willow House pour votre première conversation.');break;
    case 'home': case 'explore': closeDialog();document.querySelector('#daily-panel').classList.remove('mobile-open');break;
    case 'close':closeDialog();break;
    case 'travel':travel();break;
    case 'place':travel(target.dataset.place);break;
    case 'nearby':travel(target.dataset.place);break;
    case 'activity':everydayActivity(target.dataset.place);break;
    case 'do-activity':performActivity(Number(target.dataset.choice));break;
    case 'task': {const i=Number(target.dataset.index);if(i>state.scene&&!state.completed.includes(currentDay().scenes[i].id)){toast('Vivez d’abord le moment précédent.');break;}const s=currentDay().scenes[i];if(state.completed.includes(s.id)){openConversation(s.place,s);}else travel(s.place);break;}
    case 'tasks':document.querySelector('#daily-panel').classList.toggle('mobile-open');break;
    case 'journey':journey();break;
    case 'notebook':notebook();break;
    case 'profile':case 'settings':settings();break;
    case 'help':help();break;
    case 'mode':conversationMode=target.dataset.mode;renderConversation();break;
    case 'listen':speak(activeScene.prompt);break;
    case 'listen-slow':speak(activeScene.prompt,true);break;
    case 'listen-saved':{const s=DAYS.flatMap(d=>d.scenes).find(s=>s.id===target.dataset.id);if(s)speak(answerFor(s));break;}
    case 'answer':chooseAnswer(target);break;
    case 'hint':showHint();break;
    case 'compare':compareAnswer();break;
    case 'record':startListening();break;
    case 'guided':conversationMode='choose';renderConversation();break;
    case 'continue':continueDay();break;
    case 'day-summary':daySummary();break;
    case 'next-day':nextDay();break;
    case 'save-phrase':if(!state.saved.includes(activeScene.id)){state.saved.push(activeScene.id);persist();target.innerHTML=icon('check')+' Dans le carnet';toast('Expression ajoutée à votre carnet.');}else toast('Cette expression est déjà dans votre carnet.');break;
    case 'remove-phrase':state.saved=state.saved.filter(id=>id!==target.dataset.id);persist();notebook();break;
    case 'select-day':{const n=Number(target.dataset.day);if(n>state.day)break;if(n===state.day){closeDialog();break;}const day=getDay(n);openDialog('replay',`${closeButton()}<span class="eyebrow">DAY ${n} · REVISIT A LITTLE MOMENT</span><h2>${escape(day.title)}</h2><p>Rejouez une conversation. Votre progression actuelle reste au jour ${state.day}.</p><div class="replay-list">${day.scenes.map(s=>`<button class="answer-option" data-action="replay" data-id="${s.id}">${icon(placeIcon(s.place))}<span>${escape(s.goal)}</span>${icon('arrow')}</button>`).join('')}</div>`,'replay-dialog');break;}
    case 'replay':{const s=DAYS.flatMap(d=>d.scenes).find(s=>s.id===target.dataset.id);openConversation(s.place,s);break;}
    case 'save-settings':state.name=document.querySelector('#settings-name').value.trim()||'Charlie';state.sound=document.querySelector('#setting-sound').checked;state.reducedMotion=document.querySelector('#setting-motion').checked;persist();renderHUD();closeDialog();toast('Réglages enregistrés. Make yourself comfortable.');break;
    case 'sound':state.sound=!state.sound;persist();if(!state.sound)window.speechSynthesis?.cancel();renderHUD();break;
    case 'zoom-in':world?.changeZoom(0.15);break;
    case 'zoom-out':world?.changeZoom(-0.15);break;
    case 'map':mapIsOpen=!mapIsOpen;renderMinimap();break;
    case 'export':exportSave();break;
    case 'confirm-reset':openDialog('reset',`${closeButton()}<span class="eyebrow">A FRESH START?</span><h2>Recommencer ?</h2><p>Vos journées, vos phrases et vos notes seront effacées sur cet appareil. Vous pouvez exporter votre sauvegarde avant de continuer.</p><button class="primary-button" data-action="export">Exporter ma sauvegarde ${icon('download')}</button><div class="settings-bottom"><button class="text-button" data-action="settings">Annuler</button><button class="text-button danger" data-action="reset">Oui, effacer et recommencer</button></div>`,'settings-dialog');break;
    case 'reset':try{eraseState();}catch{}state=readState({getItem:()=>null});persist();renderHUD();welcome();break;
  }
});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('svg [data-action][role="button"]')){e.preventDefault();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});

function setupJoystick() {
  const el=document.querySelector('#joystick'),knob=el.querySelector('.joystick-knob');
  let held=false;
  const move=e=>{if(!held||!world)return;const r=el.getBoundingClientRect();let x=(e.clientX-r.left-r.width/2)/35,z=(e.clientY-r.top-r.height/2)/35;const len=Math.hypot(x,z);if(len>1){x/=len;z/=len;}world.stick={x,z};knob.style.transform=`translate(${x*25}px,${z*25}px)`;};
  el.addEventListener('pointerdown',e=>{held=true;el.setPointerCapture(e.pointerId);move(e);});
  el.addEventListener('pointermove',move);
  const end=()=>{held=false;if(world)world.stick={x:0,z:0};knob.style.transform='';};
  el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
}

renderHUD();
try {
  world=new HarbourWorld(document.querySelector('#world'), {
    onPlace:place=>travel(place),onMessage:toast,
    onPosition:pos=>{
      const dot=document.querySelector('#map-player');if(dot){dot.setAttribute('cx',87+pos.x*2.5);dot.setAttribute('cy',74+pos.z*2.6);}
      let nearest=null,best=Infinity;for(const id of Object.keys(PLACES)){const d=world.distanceTo(id);if(d<best){nearest=id;best=d;}}
      const el=document.querySelector('#nearby');
      const key=best<4.8?nearest:'walking';
      if(el.dataset.place!==key){el.dataset.place=key;el.innerHTML=best<4.8?`<span class="nearby-icon">${icon(placeIcon(nearest))}</span><span><small>VOUS ÊTES PRÈS DE</small><strong>${PLACES[nearest].name}</strong></span><button data-action="nearby" data-place="${nearest}" aria-label="Parler à ${PLACES[nearest].npc}">${icon('chat')}<span>Parler</span></button><button data-action="activity" data-place="${nearest}" aria-label="${ACTIVITIES[nearest].label}">${icon(placeIcon(nearest))}</button>`:`<span class="nearby-icon">${icon('pin')}</span><span><small>TAKE YOUR TIME</small><strong>Un petit tour dans le quartier</strong></span>`;}
    },
  });
  world.setDay(currentDay(),state.scene);world.setMission(currentScene().place);world.reducedMotion=state.reducedMotion;
  document.body.classList.add('world-ready');
} catch (error) {
  console.error('3D initialization failed:',error);
  document.body.classList.add('no-webgl');
  document.querySelector('#world-status').textContent='La 3D est indisponible sur cet appareil. Les situations restent accessibles avec les boutons Rejoindre.';
  toast('La 3D est indisponible ici. Vous pouvez jouer aux situations avec les boutons Rejoindre.');
}
setupJoystick();
if(!state.started)welcome();
window.addEventListener('pagehide',()=>{stopListening();window.speechSynthesis?.cancel();});

export { world };
