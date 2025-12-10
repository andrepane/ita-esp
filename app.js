import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js';
import {
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  setDoc,
} from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyC4b0tQJ6pESLu3_XZoQw7Q3n-YaRGeJmE',
  authDomain: 'parlaconmigo-fb132.firebaseapp.com',
  projectId: 'parlaconmigo-fb132',
  storageBucket: 'parlaconmigo-fb132.firebasestorage.app',
  messagingSenderId: '290201300452',
  appId: '1:290201300452:web:03d2562eea0ff24f96abf1',
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
let unsubscribeCoupleListener = null;

const DOM = {
  loginContainer: document.getElementById('loginContainer'),
  missionContainer: document.getElementById('missionContainer'),
  loginForm: document.getElementById('loginForm'),
  loginError: document.getElementById('loginError'),
  userName: document.getElementById('userName'),
  coupleCode: document.getElementById('coupleCode'),
  backButton: document.getElementById('backButton'),
  missionDate: document.getElementById('missionDate'),
  missionType: document.getElementById('missionType'),
  missionMeta: document.getElementById('missionMeta'),
  missionSkill: document.getElementById('missionSkill'),
  missionLevel: document.getElementById('missionLevel'),
  missionTime: document.getElementById('missionTime'),
  missionSource: document.getElementById('missionSource'),
  missionTitle: document.getElementById('missionTitle'),
  missionDescription: document.getElementById('missionDescription'),
  missionSpecificContent: document.getElementById('missionSpecificContent'),
  responseArea: document.getElementById('responseArea'),
  submitResponseButton: document.getElementById('submitResponseButton'),
  helpButton: document.getElementById('helpButton'),
  partnerStatus: document.getElementById('partnerStatus'),
  partnerStatusText: document.getElementById('partnerStatusText'),
  sharedResponsesContainer: document.getElementById('sharedResponsesContainer'),
  responsesContainer: document.getElementById('responsesContainer'),
  streakCount: document.getElementById('streakCount'),
  loadingOverlay: document.getElementById('loadingOverlay'),
  languageToggle: document.getElementById('languageToggle'),
  conversationTopic: document.getElementById('conversationTopic'),
  conversationTopicText: document.getElementById('conversationTopicText'),
};

const appState = {
  mission: null,
  response: '',
  correction: null,
};

const state = {
  user: null,
  coupleCode: null,
  mission: null,
  currentLanguage: 'es',
  today: formatDate(new Date()),
  selectedOption: null,
  coupleData: null,
};

const SESSION_KEY = 'parlaconmigo-session';
const MISSION_API_URL = 'https://magicloops.dev/api/loop/6437544d-15ac-4d41-868e-3e0229f1eebd/run';
const MISSION_API_VERSION = 'v1';

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .catch((error) => console.error('No se pudo registrar el Service Worker', error));
    });
  }
}

const conversationTopics = [
  { prompt: 'Parlate del vostro piatto italiano preferito. Quali ingredienti vi piacciono di più?' },
  { prompt: 'Raccontate un ricordo di vacanza in Italia o un posto dove vi piacerebbe andare.' },
  { prompt: 'Descrivete la vostra serata ideale a casa: cena, film o musica?' },
  { prompt: 'Parlate dei vostri gesti di gentilezza preferiti nella vita quotidiana.' },
  { prompt: 'Qual è una parola o espressione italiana che vi fa sorridere? Provate a usarla.' },
  { prompt: 'Condividete tre cose per cui siete grati oggi, usando frasi semplici.' },
  { prompt: 'Qual è una canzone italiana che conoscete? Cantate un pezzetto o parlate del testo.' },
  { prompt: 'Immaginate un fine settimana a Roma: cosa vorreste vedere o mangiare?' },
  { prompt: 'Parlate della vostra routine mattutina ideale, passo per passo, in italiano.' },
  { prompt: 'Raccontate un piccolo sogno o obiettivo per questo mesetto e come aiutarvi a vicenda.' },
  { prompt: 'Qual è il vostro dolce italiano preferito e quale ricetta vorreste provare insieme?' },
  { prompt: 'Parlate di una tradizione familiare che vi sta a cuore e spiegate perché è speciale.' },
  { prompt: 'Scegliete un film italiano da vedere insieme e spiegate cosa vi aspettate dalla trama.' },
  { prompt: 'Descrivete la vostra città ideale in Italia: clima, paesaggi, persone e cibo.' },
  { prompt: 'Condividete un proverbio o una frase che vi motiva quando avete una giornata difficile.' },
  { prompt: 'Qual è stato l’ultimo complimento sincero che avete ricevuto? Raccontatelo in italiano.' },
  { prompt: 'Parlate di un hobby nuovo che vorreste imparare quest’anno e come potreste aiutarvi.' },
  { prompt: 'Immaginate di aprire un piccolo caffè italiano insieme: come si chiamerebbe e cosa servirebbe?' },
  { prompt: 'Quale città italiana vi attira di più per il suo dialetto? Provate a imitarlo.' },
  { prompt: 'Raccontate una giornata perfetta al mare in Italia, dal mattino alla sera.' },
  { prompt: 'Parlate di un momento in cui avete fatto pace dopo un litigio: che parole hanno aiutato?' },
  { prompt: 'Scegliete un artista italiano (cantante, pittore, scrittore) e spiegate cosa vi piace delle sue opere.' },
  { prompt: 'Qual è il vostro ricordo più divertente di un errore linguistico? Raccontatelo e correggetelo.' },
  { prompt: 'Immaginate di organizzare una cena con amici italiani: quale musica suonereste e perché?' },
  { prompt: 'Parlate di un luogo naturale italiano (lago, montagna, isola) che sognate di visitare.' },
  { prompt: 'Raccontate un piccolo gesto di cura che potete fare per l’altro questa settimana.' },
  { prompt: 'Scegliete un libro italiano o una fiaba per bambini e riassumetela in poche frasi.' },
  { prompt: 'Qual è un piatto della vostra infanzia che vorreste imparare a descrivere in italiano?' },
  { prompt: 'Immaginate una playlist di tre canzoni italiane per un viaggio in auto: quali scegliete e perché?' },
];

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateToDisplay(date) {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString(state.currentLanguage === 'es' ? 'es-ES' : 'it-IT', options);
}

function normalizeCode(code) {
  return code.trim().toUpperCase();
}

function showError(message) {
  DOM.loginError.textContent = message;
  DOM.loginError.style.display = 'block';
  setTimeout(() => {
    DOM.loginError.style.display = 'none';
  }, 3000);
}

function showLoading(show) {
  DOM.loadingOverlay.classList.toggle('active', show);
}

function getCoupleDocRef() {
  return doc(db, 'couples', state.coupleCode);
}

async function ensureCoupleData() {
  const docRef = getCoupleDocRef();
  const snapshot = await getDoc(docRef);

  if (snapshot.exists()) {
    state.coupleData = snapshot.data();
    return;
  }

  const initialData = { responses: {}, help: {}, streakStart: state.today };
  await setDoc(docRef, initialData);
  state.coupleData = initialData;
}

function getCoupleData() {
  if (!state.coupleData) {
    state.coupleData = { responses: {}, help: {}, streakStart: state.today };
  }
  return state.coupleData;
}

async function saveCoupleData(updated) {
  state.coupleData = updated;
  await setDoc(getCoupleDocRef(), updated, { merge: true });
}

async function persistMissionMetadata(mission) {
  const coupleData = getCoupleData();
  if (!coupleData.missions) {
    coupleData.missions = {};
  }

  if (coupleData.missions[state.today]?.mission) {
    return;
  }

  coupleData.missions[state.today] = {
    mission,
    meta: buildMissionMetadata(mission, mission.source || 'remoto'),
  };
  await saveCoupleData(coupleData);
}

function getSavedMissionForToday() {
  const coupleData = getCoupleData();
  return coupleData.missions?.[state.today]?.mission || null;
}

function subscribeToCoupleData() {
  if (unsubscribeCoupleListener) {
    unsubscribeCoupleListener();
  }

  const docRef = getCoupleDocRef();
  unsubscribeCoupleListener = onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      state.coupleData = snapshot.data();
      renderSharedResponses();
      updatePartnerStatus();
      hydrateExistingResponse();
    }
  });
}

async function fetchRemoteMission() {
  const response = await fetch(MISSION_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      version: MISSION_API_VERSION,
      mode: 'generate',
      mission: {},
      userAnswer: '',
    }),
  });
  if (!response.ok) {
    throw new Error('Respuesta no OK del generador remoto');
  }
  return response.json();
}

function buildMissionMetadata(mission, source) {
  return {
    id: mission.id || mission.type,
    type: mission.type,
    level: mission.level || 'A1',
    skill: mission.skill || 'general',
    estimatedTime: mission.estimatedTime || 5,
    version: mission.version || MISSION_API_VERSION,
    source,
  };
}

function enrichMission(mission, source) {
  const meta = buildMissionMetadata(mission, source);
  return { ...mission, ...meta };
}

function pickLocalMission(date) {
  const mission = missionForDate(date);
  return enrichMission(mission, 'catálogo local');
}

async function fetchMission() {
  showLoading(true);
  const todayDate = new Date();
  state.today = formatDate(todayDate);

  const savedMission = getSavedMissionForToday();
  if (savedMission) {
    appState.mission = savedMission;
    state.mission = savedMission;
    renderMission();
    showLoading(false);
    return;
  }

  try {
    const remoteMission = await fetchRemoteMission();
    const enriched = enrichMission(remoteMission, 'remoto');
    appState.mission = enriched;
    state.mission = enriched;
    await persistMissionMetadata(enriched);
  } catch (error) {
    console.error('Error obteniendo la misión, usando catálogo local', error);
    const localMission = pickLocalMission(todayDate);
    showError('Usaremos una misión local mientras el generador se recupera.');
    appState.mission = localMission;
    state.mission = localMission;
    await persistMissionMetadata(localMission);
  } finally {
    renderMission();
    showLoading(false);
  }
}

async function correctUserAnswer(mission, userAnswer) {
  const response = await fetch(MISSION_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      version: MISSION_API_VERSION,
      mode: 'correct',
      mission,
      userAnswer,
    }),
  });
  if (!response.ok) {
    throw new Error('No se pudo obtener corrección del endpoint');
  }
  return response.json();
}

async function renderMission() {
  if (!state.mission) {
    return;
  }

  const todayDate = new Date();
  state.today = formatDate(todayDate);

  DOM.missionDate.textContent = formatDateToDisplay(todayDate);
  DOM.missionType.textContent = getMissionTypeDisplay(state.mission.type);
  DOM.missionTitle.textContent = state.mission.title;
  DOM.missionDescription.textContent = state.mission.description;

  renderMissionMeta(state.mission);

  renderMissionSpecificContent(state.mission);
  renderResponseArea();
}

function renderMissionMeta(mission) {
  if (!DOM.missionMeta) return;

  DOM.missionSkill.textContent = `Skill: ${mission.skill || 'general'}`;
  DOM.missionLevel.textContent = `Nivel: ${mission.level || 'A1'}`;
  DOM.missionTime.textContent = `${mission.estimatedTime || 5} min`;
  DOM.missionSource.textContent = mission.source === 'remoto' ? 'Remoto' : 'Catálogo';
}

function renderMissionSpecificContent(mission) {
  let content = '';
  switch (mission.type) {
    case 'frase-espejo':
      content = `
        <div class="highlight-block">
          <p>Frase del día:</p>
          <p class="mission-highlight">${mission.content.phrase}</p>
        </div>
      `;
      break;
    case 'palabra-del-dia':
      content = `
        <div class="highlight-block">
          <p class="mission-highlight">${mission.content.word}</p>
          <p>${mission.content.definition}</p>
          <p class="muted">Ejemplo: "${mission.content.example}"</p>
        </div>
      `;
      break;
    case 'completa-hueco':
      content = `
        <div class="highlight-block">
          <p>${mission.content.text}</p>
          <p class="mission-highlight">${mission.content.sentence.replace('___', '<span class="blank">___</span>')}</p>
        </div>
      `;
      break;
    case 'elige-escena':
      content = `
        <div class="highlight-block">
          <p>${mission.content.scenario}</p>
          <p class="muted">Elige una opción y explica por qué la elegiste.</p>
        </div>
      `;
      break;
    case 'mini-dialogo':
    default:
      content = `
        <div class="highlight-block">
          <p>Situación: ${mission.content.situation}</p>
          <p><strong>Personaje A:</strong> ${mission.content.characterA}</p>
          <p><strong>Personaje B:</strong> ${mission.content.characterB}</p>
        </div>
      `;
  }
  DOM.missionSpecificContent.innerHTML = content;
}

function renderResponseArea() {
  const { mission } = state;
  let content = '';

  if (mission.type === 'elige-escena') {
    content += `
      <div class="options-container">
        ${mission.content.options
          .map(
            (option, index) => `
            <button type="button" class="option-button" data-option="${index}">${option}</button>
          `,
          )
          .join('')}
      </div>
    `;
  }

  content += `
    <label for="responseText">Tu respuesta</label>
    <textarea id="responseText" placeholder="Escribe tu respuesta aquí..."></textarea>
    <label for="helpText">Mensaje para tu pareja (opcional)</label>
    <textarea id="helpText" placeholder="Dale pistas o ánimos aquí"></textarea>
  `;

  DOM.responseArea.innerHTML = content;

  if (mission.type === 'elige-escena') {
    const optionButtons = DOM.responseArea.querySelectorAll('.option-button');
    optionButtons.forEach((button) => {
      button.addEventListener('click', () => {
        optionButtons.forEach((btn) => btn.classList.remove('selected'));
        button.classList.add('selected');
        state.selectedOption = button.getAttribute('data-option');
      });
    });
  }

  hydrateExistingResponse();
}

function hydrateExistingResponse() {
  const coupleData = getCoupleData();
  const todayResponses = coupleData.responses[state.today] || {};
  const myResponse = todayResponses[state.user];
  const helpNotes = (coupleData.help && coupleData.help[state.today]) || [];
  const helpInput = document.getElementById('helpText');
  const responseArea = document.getElementById('responseText');

  if (myResponse) {
    responseArea.value = myResponse.response;
    responseArea.disabled = true;
    DOM.submitResponseButton.textContent = 'Respuesta enviada';
    DOM.submitResponseButton.disabled = true;
    DOM.submitResponseButton.style.backgroundColor = 'var(--success)';
  }

  if (helpNotes.length) {
    const helpFromMe = helpNotes.find((note) => note.from === state.user);
    if (helpFromMe) {
      helpInput.value = helpFromMe.text;
      helpInput.disabled = true;
      DOM.helpButton.textContent = 'Ayuda enviada';
      DOM.helpButton.disabled = true;
    }
  }
}

async function submitResponse() {
  const responseTextArea = document.getElementById('responseText');
  let response = responseTextArea.value.trim();

  if (state.mission.type === 'elige-escena' && state.selectedOption !== null) {
    const selected = state.mission.content.options[state.selectedOption];
    response = `Opción: ${selected}\n${response}`.trim();
  }

  if (!response) {
    showError('Por favor, escribe una respuesta antes de enviar.');
    return;
  }

  showLoading(true);

  appState.response = response;
  appState.correction = null;

  const coupleData = getCoupleData();
  if (!coupleData.responses[state.today]) {
    coupleData.responses[state.today] = {};
  }
  coupleData.responses[state.today][state.user] = {
    response,
    timestamp: Date.now(),
  };

  try {
    const correction = await correctUserAnswer(appState.mission, appState.response);
    appState.correction = correction;
    coupleData.responses[state.today][state.user].correction = correction;
  } catch (error) {
    console.error('No se pudo corregir la respuesta', error);
    showError('La respuesta se guardó, pero no se pudo corregir.');
  }

  await saveCoupleData(coupleData);
  showLoading(false);
  renderResponseArea();
  renderSharedResponses();
  updatePartnerStatus();
  persistSession();
}

async function sendHelpNote() {
  const helpInput = document.getElementById('helpText');
  const text = helpInput.value.trim();
  if (!text) {
    showError('Escribe un mensaje para poder ayudar a tu pareja.');
    return;
  }

  const coupleData = getCoupleData();
  if (!coupleData.help[state.today]) {
    coupleData.help[state.today] = [];
  }

  const existing = coupleData.help[state.today].find((note) => note.from === state.user);
  if (existing) {
    existing.text = text;
    existing.timestamp = Date.now();
  } else {
    coupleData.help[state.today].push({ from: state.user, text, timestamp: Date.now() });
  }

  await saveCoupleData(coupleData);
  helpInput.disabled = true;
  DOM.helpButton.textContent = 'Ayuda enviada';
  DOM.helpButton.disabled = true;
  renderSharedResponses();
}

function updatePartnerStatus() {
  const coupleData = getCoupleData();
  const todayResponses = coupleData.responses[state.today] || {};
  const partnerNames = Object.keys(todayResponses).filter((name) => name !== state.user);
  if (partnerNames.length) {
    DOM.partnerStatus.classList.remove('waiting');
    DOM.partnerStatus.classList.add('completed');
    DOM.partnerStatusText.innerHTML = `¡<strong>${partnerNames[0]}</strong> ya respondió!`;
    DOM.partnerStatus.querySelector('i').className = 'fas fa-check-circle';
  } else {
    DOM.partnerStatus.classList.add('waiting');
    DOM.partnerStatus.classList.remove('completed');
    DOM.partnerStatusText.textContent = 'Esperando respuesta de tu pareja...';
    DOM.partnerStatus.querySelector('i').className = 'fas fa-hourglass-half';
  }
}

function renderSharedResponses() {
  const coupleData = getCoupleData();
  const todayResponses = coupleData.responses[state.today] || {};
  const helpNotes = coupleData.help[state.today] || [];
  const responses = Object.entries(todayResponses);

  updatePartnerStatus();

  if (responses.length === 0) {
    DOM.sharedResponsesContainer.style.display = 'none';
    if (DOM.conversationTopic) {
      DOM.conversationTopic.style.display = 'none';
    }
    return;
  }

  const hasBoth = responses.length >= 2;
  renderConversationTopic(hasBoth);

  if (hasBoth) {
    DOM.sharedResponsesContainer.style.display = 'block';
    DOM.streakCount.textContent = calculateStreak(coupleData);
  } else {
    DOM.sharedResponsesContainer.style.display = 'none';
  }

  const cards = responses
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, data]) => createResponseCard(name, data, helpNotes))
    .join('');
  DOM.responsesContainer.innerHTML = cards;
}

function renderConversationTopic(hasBothResponses) {
  if (!DOM.conversationTopic || !DOM.conversationTopicText) return;

  if (!hasBothResponses) {
    DOM.conversationTopic.style.display = 'none';
    return;
  }

  const topic = getConversationTopicForDate(new Date(state.today));
  DOM.conversationTopicText.textContent = topic.prompt;
  DOM.conversationTopic.style.display = 'block';
}

function createResponseCard(name, responseData, helpNotes) {
  const { response, correction } = responseData;
  const notes = helpNotes
    .filter((note) => note.from !== name)
    .map(
      (note) => `
      <div class="help-note">
        <strong>${note.from}</strong> te dejó ayuda:<br>${note.text.replace(/\n/g, '<br>')}
      </div>
    `,
    )
    .join('');

  const correctionBlock = correction
    ? `
      <div class="correction-block">
        <p><strong>Feedback:</strong> ${correction.feedback || 'Sin feedback'}</p>
        <p><strong>Versión corregida:</strong> ${(correction.corrected || '').replace(/\n/g, '<br>')}</p>
        <p><strong>Puntuación:</strong> ${correction.score ?? 'N/A'}</p>
        ${renderMicroTips(response, correction, state.mission)}
      </div>
    `
    : '';

  return `
    <div class="response-card">
      <div class="response-header">
        <i class="fas fa-user-circle"></i>
        <span>${name}</span>
      </div>
      <div class="response-text">${response.replace(/\n/g, '<br>')}</div>
      ${correctionBlock}
      ${notes}
    </div>
  `;
}

function renderMicroTips(response, correction, mission) {
  const tips = buildMicroTips(response, correction, mission);
  if (!tips.length) return '';

  const items = tips.map((tip) => `<li>${tip}</li>`).join('');
  return `
    <div class="micro-tips">
      <p class="muted">Mini-tips de repaso:</p>
      <ul>${items}</ul>
    </div>
  `;
}

function buildMicroTips(response, correction, mission) {
  const tips = [];
  const normalizedResponse = (response || '').toLowerCase();

  if (mission?.type === 'palabra-del-dia' && mission.content?.word) {
    const keyword = mission.content.word.toLowerCase();
    if (!normalizedResponse.includes(keyword)) {
      tips.push(`Intenta usar la palabra clave "${mission.content.word}" en tu frase.`);
    }
  }

  if (mission?.type === 'completa-hueco') {
    tips.push('Verifica concordancia de género y número cuando completes la frase.');
  }

  if (correction?.score !== undefined && correction.score < 8) {
    tips.push('Revisa artículos definidos/indefinidos (il, la, un, una) para mejorar la fluidez.');
  }

  if (!tips.length) {
    tips.push('Guarda esta corrección para repasarla juntos en la próxima sesión.');
  }

  return tips;
}

function calculateStreak(coupleData) {
  let streak = 0;
  const today = new Date(state.today);
  for (let i = 0; i < 30; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = formatDate(date);
    const responses = coupleData.responses[key];
    if (responses && Object.keys(responses).length >= 2) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

function getConversationTopicForDate(date) {
  const index = date.getDate() + date.getMonth() * 31 + date.getFullYear();
  return conversationTopics[index % conversationTopics.length];
}

function getMissionTypeDisplay(type) {
  const types = {
    'frase-espejo': 'Frase Espejo',
    'palabra-del-dia': 'Palabra del Día',
    'completa-hueco': 'Completa el Hueco',
    'elige-escena': 'Elige la Escena',
    'mini-dialogo': 'Mini Diálogo',
  };
  return types[type] || type;
}

function persistSession() {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ user: state.user, coupleCode: state.coupleCode, language: state.currentLanguage }),
  );
}

async function restoreSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (session?.user && session?.coupleCode) {
      state.user = session.user;
      state.coupleCode = session.coupleCode;
      state.currentLanguage = session.language || 'es';
      DOM.userName.value = session.user;
      DOM.coupleCode.value = session.coupleCode;
      await enterApp();
    }
  } catch (error) {
    console.error('No se pudo restaurar la sesión', error);
  }
}

function returnToHome() {
  if (unsubscribeCoupleListener) {
    unsubscribeCoupleListener();
    unsubscribeCoupleListener = null;
  }

  const currentName = state.user || DOM.userName.value || '';
  const currentCode = state.coupleCode || DOM.coupleCode.value || '';

  state.user = null;
  state.coupleCode = null;
  state.mission = null;
  state.selectedOption = null;
  state.coupleData = null;
  appState.mission = null;
  appState.response = '';
  appState.correction = null;

  localStorage.removeItem(SESSION_KEY);

  DOM.userName.value = currentName;
  DOM.coupleCode.value = currentCode;
  DOM.loginContainer.style.display = 'flex';
  DOM.missionContainer.style.display = 'none';
  DOM.loginError.textContent = '';
  DOM.loginError.style.display = 'none';
}

async function enterApp() {
  DOM.loginContainer.style.display = 'none';
  DOM.missionContainer.style.display = 'block';
  state.today = formatDate(new Date());
  await ensureCoupleData();
  subscribeToCoupleData();
  await fetchMission();
  renderSharedResponses();
  updatePartnerStatus();
  persistSession();
}

async function handleLogin(event) {
  event.preventDefault();
  const name = DOM.userName.value.trim();
  const code = normalizeCode(DOM.coupleCode.value);

  if (!name || !code) {
    showError('Completa tu nombre y código de pareja.');
    return;
  }

  state.user = name;
  state.coupleCode = code;
  state.selectedOption = null;
  await enterApp();
}

function switchLanguage() {
  state.currentLanguage = state.currentLanguage === 'es' ? 'it' : 'es';
  persistSession();
  renderMission();
}

async function init() {
  DOM.loginForm.addEventListener('submit', handleLogin);
  DOM.submitResponseButton.addEventListener('click', submitResponse);
  DOM.helpButton.addEventListener('click', sendHelpNote);
  DOM.languageToggle.addEventListener('click', switchLanguage);
  DOM.backButton.addEventListener('click', returnToHome);
  await restoreSession();
}

document.addEventListener('DOMContentLoaded', () => {
  init();
});

registerServiceWorker();
