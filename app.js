// ---------------------------
// Utilidades básicas de fecha
// ---------------------------

function formatDateLabel(dateObj) {
  const formatter = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
  return formatter.format(dateObj);
}

function getTodayKey() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ---------------------------
// Datos base de misiones
// ---------------------------

const missionTemplates = [
  {
    id: "mirror-1",
    type: "frase-espejo",
    title: "Frase de cómo te sientes hoy",
    description:
      "Escribe una frase corta en italiano sobre cómo te sientes hoy. Luego, escribid juntos la versión en español.",
    helper:
      "No busques frases perfectas; con 6–10 palabras basta. Lo importante es usar palabras reales de tu día.",
    exampleIt: "Oggi sono stanco ma contento del lavoro.",
    exampleEs: "Hoy estoy cansado pero contento con el trabajo.",
  },
  {
    id: "mirror-2",
    type: "frase-espejo",
    title: "Plan pequeño para mañana",
    description:
      "Escribe en italiano un plan pequeño para mañana, algo muy concreto que quieras hacer.",
    helper:
      "Puede ser algo normal: pasear, cocinar algo, ver una serie… Cuanto más real, mejor.",
    exampleIt: "Domani voglio fare una passeggiata con te.",
    exampleEs: "Mañana quiero dar un paseo contigo.",
  },
  {
    id: "word-1",
    type: "palabra-del-dia",
    title: "Palabra del día",
    description:
      "Elige una palabra en italiano que describa tu día. Solo una palabra. Luego, buscad juntos cómo decirla en español.",
    helper:
      "Piensa en algo simple: 'caos', 'tranquillo', 'stressato', 'felice'… No hace falta que sea perfecta.",
    suggestions: ["caos", "tranquillo", "stressato", "felice", "pieno"],
  },
  {
    id: "word-2",
    type: "palabra-del-dia",
    title: "Palabra-clima",
    description:
      "Piensa en el día como si fuera un tiempo meteorológico y ponlo en italiano: 'nuvoloso', 'soleggiato', 'piovoso'...",
    helper:
      "No es literal, es un juego: tu día puede ser 'soleggiato' aunque haya llovido fuera.",
    suggestions: ["soleggiato", "nuvoloso", "piovoso", "freddo", "caldo"],
  },
  {
    id: "gap-1",
    type: "completa-hueco",
    title: "Completa la frase",
    description:
      "Completa esta frase en italiano con la opción que mejor encaje. Luego, cread juntos una frase similar en español.",
    helper:
      "Si dudas, eligid la que suene más natural para vosotros. Esto es un juego, no un examen.",
    sentence:
      "Oggi al lavoro ______ un sacco di cose da fare.",
    options: ["ho avuto", "sono", "faccio"],
    correctIndex: 0,
    translationHint: "Hoy en el trabajo he tenido un montón de cosas que hacer.",
  },
  {
    id: "gap-2",
    type: "completa-hueco",
    title: "Momento en casa",
    description:
      "Completa esta frase. Piensa en vuestras rutinas reales en casa.",
    helper:
      "Imaginad la escena en vuestra cabeza, no hace falta que coincida exactamente con vuestro día.",
    sentence: "Stasera a casa voglio ______ qualcosa di buono.",
    options: ["mangiare", "dormire", "correre"],
    correctIndex: 0,
    translationHint: "Esta noche en casa quiero comer algo rico.",
  },
];

// ---------------------------
// Elección estable de misión
// ---------------------------

function getMissionForToday() {
  const key = getTodayKey();
  // Hash simple de la fecha para elegir siempre la misma misión para ese día
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  const index = hash % missionTemplates.length;
  return missionTemplates[index];
}

// ---------------------------
// Gestión de estado en localStorage
// ---------------------------

const STORAGE_KEYS = {
  PROFILE: "linguaduo_profile",
  RESPONSES: "linguaduo_responses", // objeto { "YYYY-MM-DD": { missionId, type, data } }
};

function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error al cargar perfil:", e);
    return null;
  }
}

function saveProfile(profile) {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error("Error al guardar perfil:", e);
  }
}

function loadResponses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESPONSES);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error al cargar respuestas:", e);
    return {};
  }
}

function saveResponses(responses) {
  try {
    localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(responses));
  } catch (e) {
    console.error("Error al guardar respuestas:", e);
  }
}

// ---------------------------
// Render de misión según tipo
// ---------------------------

const dayLabelEl = document.getElementById("day-label");
const missionTitleEl = document.getElementById("mission-title");
const missionTypePillEl = document.getElementById("mission-type-pill");
const missionDescriptionEl = document.getElementById("mission-description");
const missionContentEl = document.getElementById("mission-content");
const missionStatusEl = document.getElementById("mission-status");

const saveBtn = document.getElementById("save-response-btn");
const clearBtn = document.getElementById("clear-response-btn");

const setupForm = document.getElementById("setup-form");
const youNameInput = document.getElementById("you-name");
const partnerNameInput = document.getElementById("partner-name");
const activePlayerSelect = document.getElementById("active-player");

const setupCard = document.getElementById("setup-card");
const missionCard = document.getElementById("mission-card");
const historyListEl = document.getElementById("history-list");

let currentMission = null;
let currentProfile = null;

function getMissionTypeLabel(type) {
  switch (type) {
    case "frase-espejo":
      return "Frase espejo";
    case "palabra-del-dia":
      return "Palabra del día";
    case "completa-hueco":
      return "Completa el hueco";
    default:
      return "Misión";
  }
}

function renderMission(mission, existingResponse) {
  const today = new Date();
  dayLabelEl.textContent = formatDateLabel(today);
  missionTitleEl.textContent = mission.title;
  missionTypePillEl.textContent = getMissionTypeLabel(mission.type);
  missionDescriptionEl.textContent = mission.description;

  missionContentEl.innerHTML = "";
  missionStatusEl.innerHTML = "";

  if (mission.type === "frase-espejo") {
    renderMirrorMission(mission, existingResponse);
  } else if (mission.type === "palabra-del-dia") {
    renderWordMission(mission, existingResponse);
  } else if (mission.type === "completa-hueco") {
    renderGapMission(mission, existingResponse);
  }

  updateMissionStatus(existingResponse);
}

function renderMirrorMission(mission, existingResponse) {
  const wrapperIt = document.createElement("div");
  wrapperIt.className = "language-row";
  wrapperIt.innerHTML = `
    <span class="language-label">Frase en italiano</span>
    <textarea id="mirror-it" placeholder="${mission.exampleIt}"></textarea>
    <p class="mission-helper">${mission.helper}</p>
  `;

  const wrapperEs = document.createElement("div");
  wrapperEs.className = "language-row";
  wrapperEs.innerHTML = `
    <span class="language-label">Versión en español</span>
    <textarea id="mirror-es" placeholder="${mission.exampleEs}"></textarea>
    <p class="mission-example"><strong>Ejemplo:</strong> <br>${mission.exampleEs}</p>
  `;

  missionContentEl.appendChild(wrapperIt);
  missionContentEl.appendChild(wrapperEs);

  if (existingResponse && existingResponse.data) {
    const { itText, esText } = existingResponse.data;
    const itEl = document.getElementById("mirror-it");
    const esEl = document.getElementById("mirror-es");
    if (itText) itEl.value = itText;
    if (esText) esEl.value = esText;
  }
}

function renderWordMission(mission, existingResponse) {
  const wrapper = document.createElement("div");
  wrapper.className = "language-row";
  const suggestionsHtml = mission.suggestions
    ? `<p class="mission-helper">Ideas: ${mission.suggestions.join(" · ")}</p>`
    : "";

  wrapper.innerHTML = `
    <span class="language-label">Tu palabra en italiano</span>
    <input type="text" id="word-it" placeholder="${mission.suggestions?.[0] || "tranquillo"}">
    ${suggestionsHtml}
    <p class="mission-example">
      Usa la palabra luego en una frase real con tu pareja.<br>
      Ejemplo: <em>"Oggi è stato un giorno tranquillo."</em>
    </p>
  `;

  missionContentEl.appendChild(wrapper);

  if (existingResponse && existingResponse.data) {
    const { word } = existingResponse.data;
    const wordEl = document.getElementById("word-it");
    if (word) wordEl.value = word;
  }
}

function renderGapMission(mission, existingResponse) {
  const wrapper = document.createElement("div");
  wrapper.className = "language-row";

  const optionsHtml = mission.options
    .map((opt, index) => {
      const id = `gap-opt-${index}`;
      return `
        <label for="${id}" style="display:flex;align-items:center;gap:6px;font-size:13px;">
          <input type="radio" name="gap-option" id="${id}" value="${index}">
          <span>${opt}</span>
        </label>
      `;
    })
    .join("");

  wrapper.innerHTML = `
    <span class="language-label">Elige la opción que completa mejor:</span>
    <p class="mission-example">
      ${mission.sentence.replace("______", "<strong>______</strong>")}
    </p>
    <div class="gap-options">
      ${optionsHtml}
    </div>
    <p class="mission-helper">${mission.helper}</p>
    <p class="mission-example">
      Pista/traducción aproximada:<br>
      <em>${mission.translationHint}</em>
    </p>
  `;

  missionContentEl.appendChild(wrapper);

  if (existingResponse && typeof existingResponse.data?.selectedIndex === "number") {
    const radio = document.querySelector(
      `input[name="gap-option"][value="${existingResponse.data.selectedIndex}"]`
    );
    if (radio) {
      radio.checked = true;
    }
  }
}

function updateMissionStatus(existingResponse) {
  missionStatusEl.innerHTML = "";
  const dot = document.createElement("span");
  dot.className = "status-dot";

  const text = document.createElement("span");

  if (!existingResponse) {
    dot.classList.add("pending");
    text.textContent =
      "Pendiente: aún no has guardado nada para la misión de hoy en este dispositivo.";
  } else {
    dot.classList.add("done");
    text.textContent = "Guardado para hoy en este dispositivo. Podéis comentarlo juntos.";
  }

  missionStatusEl.appendChild(dot);
  missionStatusEl.appendChild(text);
}

// ---------------------------
// Guardar y borrar respuesta
// ---------------------------

function collectResponseForCurrentMission() {
  if (!currentMission) return null;

  switch (currentMission.type) {
    case "frase-espejo": {
      const itEl = document.getElementById("mirror-it");
      const esEl = document.getElementById("mirror-es");
      return {
        missionId: currentMission.id,
        type: currentMission.type,
        data: {
          itText: itEl ? itEl.value.trim() : "",
          esText: esEl ? esEl.value.trim() : "",
        },
      };
    }
    case "palabra-del-dia": {
      const wordEl = document.getElementById("word-it");
      return {
        missionId: currentMission.id,
        type: currentMission.type,
        data: {
          word: wordEl ? wordEl.value.trim() : "",
        },
      };
    }
    case "completa-hueco": {
      const selected = document.querySelector('input[name="gap-option"]:checked');
      const selectedIndex = selected ? parseInt(selected.value, 10) : null;
      return {
        missionId: currentMission.id,
        type: currentMission.type,
        data: {
          selectedIndex,
        },
      };
    }
    default:
      return null;
  }
}

function onSaveResponse() {
  const resp = collectResponseForCurrentMission();
  if (!resp) return;

  const todayKey = getTodayKey();
  const all = loadResponses();
  all[todayKey] = resp;
  saveResponses(all);
  updateMissionStatus(resp);
  renderHistory();
}

function onClearResponse() {
  const todayKey = getTodayKey();
  const all = loadResponses();
  if (all[todayKey]) {
    delete all[todayKey];
    saveResponses(all);
  }
  updateMissionStatus(null);
  renderHistory();
}

// ---------------------------
// Historial últimos 7 días
// ---------------------------

function renderHistory() {
  const all = loadResponses();
  const today = new Date();
  historyListEl.innerHTML = "";

  for (let i = 0; i < 7; i++) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(day.getDate()).padStart(2, "0")}`;

    const li = document.createElement("li");
    li.className = "history-item";

    const left = document.createElement("span");
    left.className = "date";
    left.textContent = formatDateLabel(day);

    const right = document.createElement("span");
    right.className = "state";

    const stateLabel = document.createElement("span");
    stateLabel.className = "state-label";

    if (all[key]) {
      stateLabel.classList.add("done");
      stateLabel.textContent = "Hecho aquí";
    } else {
      stateLabel.classList.add("pending");
      stateLabel.textContent = "Sin respuesta";
    }

    right.appendChild(stateLabel);
    li.appendChild(left);
    li.appendChild(right);
    historyListEl.appendChild(li);
  }
}

// ---------------------------
// Perfil / configuración
// ---------------------------

function applyProfileToUI(profile) {
  if (!profile) return;
  youNameInput.value = profile.youName || "";
  partnerNameInput.value = profile.partnerName || "";
  activePlayerSelect.value = profile.activePlayer || "you";
}

function initProfile() {
  const profile = loadProfile();
  currentProfile = profile;
  if (profile) {
    applyProfileToUI(profile);
  }
}

setupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const youName = youNameInput.value.trim() || "Yo";
  const partnerName = partnerNameInput.value.trim() || "Pareja";
  const activePlayer = activePlayerSelect.value || "you";

  const profile = { youName, partnerName, activePlayer };
  currentProfile = profile;
  saveProfile(profile);

  // Mostrar tarjeta de misión (ya está creada pero oculta)
  missionCard.classList.remove("hidden");
  // Ya está todo listo, solo recargamos misión para refrescar textos
  loadMissionForToday();
});

// ---------------------------
// Inicialización
// ---------------------------

function loadMissionForToday() {
  currentMission = getMissionForToday();
  const todayKey = getTodayKey();
  const all = loadResponses();
  const existing = all[todayKey] || null;
  renderMission(currentMission, existing);
}

function initButtons() {
  saveBtn.addEventListener("click", onSaveResponse);
  clearBtn.addEventListener("click", onClearResponse);
}

function init() {
  initProfile();
  initButtons();
  loadMissionForToday();
  renderHistory();

  // Mostrar tarjeta de misión desde el principio, para que puedas ver el flujo fácilmente
  missionCard.classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", init);
