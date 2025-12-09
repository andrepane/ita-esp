const DOM = {
  loginContainer: document.getElementById('loginContainer'),
  missionContainer: document.getElementById('missionContainer'),
  loginForm: document.getElementById('loginForm'),
  loginError: document.getElementById('loginError'),
  userName: document.getElementById('userName'),
  coupleCode: document.getElementById('coupleCode'),
  missionDate: document.getElementById('missionDate'),
  missionType: document.getElementById('missionType'),
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
};

const STORAGE_KEY = 'parlaconmigo-data';
const SESSION_KEY = 'parlaconmigo-session';

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

function getStoredData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { couples: {} };
  } catch (error) {
    console.error('Error leyendo localStorage', error);
    return { couples: {} };
  }
}

function saveStoredData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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

async function fetchMission() {
  showLoading(true);
  try {
    const response = await fetch('https://magicloops.dev/api/loop/6437544d-15ac-4d41-868e-3e0229f1eebd/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'generate',
        mission: {},
        userAnswer: '',
      }),
    });
    const data = await response.json();
    appState.mission = data;
    state.mission = data;
    renderMission();
  } catch (error) {
    console.error('Error obteniendo la misión', error);
    showError('No se pudo obtener la misión. Intenta nuevamente.');
  } finally {
    showLoading(false);
  }
}

async function correctUserAnswer(mission, userAnswer) {
  const response = await fetch('https://magicloops.dev/api/loop/6437544d-15ac-4d41-868e-3e0229f1eebd/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'correct',
      mission,
      userAnswer,
    }),
  });
  const data = await response.json();
  return data;
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

  renderMissionSpecificContent(state.mission);
  renderResponseArea();
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

function getCoupleData() {
  const data = getStoredData();
  const code = state.coupleCode;
  if (!data.couples[code]) {
    data.couples[code] = { responses: {}, help: {}, streakStart: state.today };
  }
  return data.couples[code];
}

function saveCoupleData(updated) {
  const data = getStoredData();
  data.couples[state.coupleCode] = updated;
  saveStoredData(data);
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

  saveCoupleData(coupleData);
  showLoading(false);
  renderResponseArea();
  renderSharedResponses();
  updatePartnerStatus();
  persistSession();
}

function sendHelpNote() {
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

  saveCoupleData(coupleData);
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
    return;
  }

  const hasBoth = responses.length >= 2;
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

function restoreSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (session?.user && session?.coupleCode) {
      state.user = session.user;
      state.coupleCode = session.coupleCode;
      state.currentLanguage = session.language || 'es';
      DOM.userName.value = session.user;
      DOM.coupleCode.value = session.coupleCode;
      enterApp();
    }
  } catch (error) {
    console.error('No se pudo restaurar la sesión', error);
  }
}

async function enterApp() {
  DOM.loginContainer.style.display = 'none';
  DOM.missionContainer.style.display = 'block';
  await fetchMission();
  renderSharedResponses();
  updatePartnerStatus();
  persistSession();
}

function handleLogin(event) {
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
  enterApp();
}

function switchLanguage() {
  state.currentLanguage = state.currentLanguage === 'es' ? 'it' : 'es';
  persistSession();
  renderMission();
}

function handleStorageChange(event) {
  if (event.key === STORAGE_KEY && state.coupleCode) {
    renderSharedResponses();
    updatePartnerStatus();
    hydrateExistingResponse();
  }
}

function init() {
  DOM.loginForm.addEventListener('submit', handleLogin);
  DOM.submitResponseButton.addEventListener('click', submitResponse);
  DOM.helpButton.addEventListener('click', sendHelpNote);
  DOM.languageToggle.addEventListener('click', switchLanguage);
  window.addEventListener('storage', handleStorageChange);
  restoreSession();
}

document.addEventListener('DOMContentLoaded', init);
