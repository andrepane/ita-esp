// ---------------------------
// Utilidades de fecha y hash
// ---------------------------

function formatDateLabel(dateObj) {
  const formatter = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
  return formatter.format(dateObj);
}

function getDateKey(dateObj = new Date()) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function seededRandom(seed, salt = "") {
  const mixed = hashString(`${seed}-${salt}`);
  return (mixed % 10000) / 10000;
}

function pickFromArray(arr, seed, salt) {
  if (!arr.length) return null;
  const index = Math.floor(seededRandom(seed, salt) * arr.length);
  return arr[index];
}

// ---------------------------
// Datos combinables para misiones
// ---------------------------

const baseData = {
  topics: ["trabajo", "casa", "ocio", "pareja", "perro", "salud", "emociones", "planes"],
  verbs: ["volere", "fare", "andare", "avere", "essere", "sentire", "potere", "pensare", "dormire", "mangiare"],
  adjectives: ["stanco", "felice", "tranquillo", "nervoso", "occupato", "libero", "curioso", "orgoglioso"],
  feelings: ["soddisfatto", "preoccupato", "sereno", "ispirato", "annoiato", "motivatissimo", "calmo", "energico"],
  wordCategories: {
    trabajo: ["riunione", "progetto", "scadenza", "ufficio", "telefono"],
    casa: ["cena", "cucina", "lavatrice", "ordine", "divano"],
    emociones: ["felicità", "ansia", "nostalgia", "gratitudine", "calma"],
    salud: ["riposo", "camminata", "mal di testa", "stretching", "respirazione"],
    planes: ["viaggio", "film", "passeggiata", "ristorante", "allenamento"],
  },
  gapPieces: {
    start: ["Oggi al", "Stamattina", "Stasera", "Dopo il lavoro", "Nel pomeriggio"],
    place: ["lavoro", "parco", "casa", "supermercato", "palestra"],
    verbs: ["ho", "voglio", "posso", "devo"],
    tails: [
      "______ un sacco di cose da fare.",
      "______ incontrare una persona importante.",
      "______ comprare qualcosa di speciale.",
      "______ preparare qualcosa di buono.",
    ],
  },
  scenes: {
    lavoro: {
      label: "Trabajo",
      text: "Al lavoro oggi ho mille riunioni y una scadenza.",
      suggestion: "Puoi dire: 'Oggi voglio finire tutto prima di cena.'",
    },
    casa: {
      label: "Casa",
      text: "A casa dobbiamo mettere in ordine e cucinare qualcosa di semplice.",
      suggestion: "Probad: 'Stasera cuciniamo insieme la pasta?'",
    },
    libero: {
      label: "Tiempo libre",
      text: "Nel tempo libero vorrei solo rilassarmi e guardare una serie.",
      suggestion: "Usa: 'Dopo cena voglio vedere un episodio con te.'",
    },
  },
};

// ---------------------------
// Plantillas de misión combinables
// ---------------------------

const missionTemplates = [
  {
    type: "frase-espejo",
    title: "Frase espejo diaria",
    description: "Escribe tu frase en italiano y reflejala en español sin agobios.",
    generate(seed, dateKey) {
      const topic = pickFromArray(baseData.topics, seed, "mirror-topic");
      const verb = pickFromArray(baseData.verbs, seed, "mirror-verb");
      const adjective = pickFromArray(baseData.adjectives, seed, "mirror-adj");
      const feeling = pickFromArray(baseData.feelings, seed, "mirror-feel");

      const exampleIt = `Oggi nel ${topic} ${verb} ${feeling} ma anche ${adjective}.`;
      const exampleEs = "Hoy me siento así y está bien: no hace falta decirlo perfecto.";

      return {
        id: `mirror-${dateKey}`,
        type: "frase-espejo",
        title: "Frase espejo del día",
        description: `Piensa en ${topic} hoy y escríbelo en italiano. Luego, reflejadlo en español sin buscar perfección.`,
        helper:
          "Solo 2-3 ideas clave valen. Lo importante es que os suene real a los dos.",
        exampleIt,
        exampleEs,
        meta: { topic, verb, adjective, feeling },
      };
    },
  },
  {
    type: "palabra-del-dia",
    title: "Palabra del día",
    description: "Elige una palabra italiana que resuma tu día y úsala luego en una frase real.",
    generate(seed, dateKey) {
      const categoryKeys = Object.keys(baseData.wordCategories);
      const category = pickFromArray(categoryKeys, seed, "word-cat");
      const suggestions = baseData.wordCategories[category];
      const placeholder = pickFromArray(suggestions, seed, "word-placeholder");
      return {
        id: `word-${category}-${dateKey}`,
        type: "palabra-del-dia",
        title: `Palabra sobre ${category}`,
        description:
          "Escribe una sola palabra en italiano que describa tu día. Luego, anímate a usarla en una frase durante la tarde.",
        helper: `Ideas rápidas para ${category}: ${suggestions.join(" · ")}`,
        suggestions,
        placeholder,
        meta: { category },
      };
    },
  },
  {
    type: "completa-hueco",
    title: "Completa el hueco",
    description: "Elige la opción que mejor encaje. Se marca en verde si aciertas.",
    generate(seed, dateKey) {
      const start = pickFromArray(baseData.gapPieces.start, seed, "gap-start");
      const place = pickFromArray(baseData.gapPieces.place, seed, "gap-place");
      const tail = pickFromArray(baseData.gapPieces.tails, seed, "gap-tail");
      const correctVerb = pickFromArray(baseData.gapPieces.verbs, seed, "gap-verb");
      const wrongOptions = baseData.verbs.filter((v) => v !== correctVerb);
      const distractorA = pickFromArray(wrongOptions, seed, "gap-d1");
      const distractorB = pickFromArray(
        wrongOptions.filter((v) => v !== distractorA),
        seed,
        "gap-d2"
      );
      const options = [correctVerb, distractorA, distractorB].sort();
      const correctIndex = options.indexOf(correctVerb);

      const sentence = `${start} ${place} ${tail}`;
      const translationHint = "Piensa en una escena real: solo es un hueco para elegir.";

      return {
        id: `gap-${dateKey}-${correctVerb}`,
        type: "completa-hueco",
        title: "Completa el hueco",
        description:
          "Lee la frase y marca la opción que suene más natural. El color te dirá si acertaste.",
        helper: "Hablad en voz alta cómo sonaría cada opción.",
        sentence,
        options,
        correctIndex,
        translationHint,
        meta: { place, verb: correctVerb },
      };
    },
  },
  {
    type: "elige-escena",
    title: "Elige la escena",
    description: "Selecciona la escena italiana que más se parezca a tu día de hoy.",
    generate(seed, dateKey) {
      const sceneKeys = Object.keys(baseData.scenes);
      const shuffled = sceneKeys
        .map((key) => ({ key, rand: seededRandom(seed, key) }))
        .sort((a, b) => a.rand - b.rand)
        .slice(0, 3)
        .map(({ key }) => key);

      const scenes = shuffled.map((key) => baseData.scenes[key]);
      const suggested = pickFromArray(scenes, seed, "scene-suggest");

      return {
        id: `scene-${dateKey}`,
        type: "elige-escena",
        title: "¿Qué escena te representa?",
        description:
          "Lee las mini-escenas y toca la que encaje con tu día. Te sugerimos una frase extra en italiano.",
        helper: "No hay opción mala: elige la que te haga hablar más.",
        scenes,
        suggestion: suggested?.suggestion || "",
        meta: { scenes: shuffled },
      };
    },
  },
  {
    type: "mini-dialogo",
    title: "Mini diálogo",
    description: "Crea un micro diálogo: tú en italiano, tu pareja responde en español.",
    generate(seed, dateKey) {
      const topic = pickFromArray(baseData.topics, seed, "dialog-topic");
      const verb = pickFromArray(baseData.verbs, seed, "dialog-verb");
      const adjective = pickFromArray(baseData.adjectives, seed, "dialog-adj");

      const promptIt = `Io dico: "Oggi nel ${topic} voglio ${verb} qualcosa di ${adjective}."`;
      const promptEs = "Respuesta de tu pareja en español: improvisad juntos.";

      return {
        id: `dialog-${dateKey}`,
        type: "mini-dialogo",
        title: "Pequeño diálogo",
        description:
          "Escribe una frase corta en italiano y la respuesta de tu pareja en español. No se corrige: solo guardad vuestras versiones.",
        helper:
          "Imaginad que estáis en un chat rápido. Manténlo ligero y natural.",
        promptIt,
        promptEs,
        meta: { topic, verb },
      };
    },
  },
];

// ---------------------------
// Almacenamiento en localStorage
// ---------------------------

const STORAGE_KEYS = {
  PROFILE: "parlaconmigo_profile",
  RESPONSES: "parlaconmigo_responses", // { "YYYY-MM-DD": { dateKey, missionType, missionId, missionMeta, data } }
};

function safeParse(json, fallback) {
  try {
    return json ? JSON.parse(json) : fallback;
  } catch (e) {
    console.error("Error al parsear JSON", e);
    return fallback;
  }
}

function loadProfile() {
  return safeParse(localStorage.getItem(STORAGE_KEYS.PROFILE), null);
}

function saveProfile(profile) {
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
}

function loadResponses() {
  return safeParse(localStorage.getItem(STORAGE_KEYS.RESPONSES), {});
}

function saveResponses(responses) {
  localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(responses));
}

// ---------------------------
// DOM y estado global
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

const missionCard = document.getElementById("mission-card");
const historyListEl = document.getElementById("history-list");

let currentMission = null;
let currentProfile = null;

// ---------------------------
// Generación y elección diaria
// ---------------------------

function getMissionTypeLabel(type) {
  switch (type) {
    case "frase-espejo":
      return "Frase espejo";
    case "palabra-del-dia":
      return "Palabra del día";
    case "completa-hueco":
      return "Completa el hueco";
    case "elige-escena":
      return "Elige escena";
    case "mini-dialogo":
      return "Mini diálogo";
    default:
      return "Misión";
  }
}

function buildMissionForDate(dateKey) {
  const seed = hashString(dateKey);
  const template = missionTemplates[seed % missionTemplates.length];
  const mission = template.generate(seed, dateKey);
  return mission;
}

function getMissionForToday() {
  const todayKey = getDateKey();
  return buildMissionForDate(todayKey);
}

// ---------------------------
// Render por tipo de misión
// ---------------------------

function renderMission(mission, existingResponse) {
  const today = new Date();
  dayLabelEl.textContent = formatDateLabel(today);
  missionTitleEl.textContent = mission.title;
  missionTypePillEl.textContent = getMissionTypeLabel(mission.type);
  missionDescriptionEl.textContent = mission.description;

  missionContentEl.innerHTML = "";
  missionStatusEl.innerHTML = "";

  const renderers = {
    "frase-espejo": renderMirrorMission,
    "palabra-del-dia": renderWordMission,
    "completa-hueco": renderGapMission,
    "elige-escena": renderSceneMission,
    "mini-dialogo": renderDialogMission,
  };

  const renderer = renderers[mission.type];
  if (renderer) renderer(mission, existingResponse);
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
    <p class="mission-example"><strong>Ejemplo:</strong> <br>${mission.exampleIt}</p>
  `;

  missionContentEl.appendChild(wrapperIt);
  missionContentEl.appendChild(wrapperEs);

  if (existingResponse?.data) {
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
    <div class="tip-inline">Categoría: <span class="small-highlight">${mission.meta.category}</span></div>
    <span class="language-label">Tu palabra en italiano</span>
    <input type="text" id="word-it" placeholder="${mission.placeholder || "tranquillo"}">
    ${suggestionsHtml}
    <p class="mission-example">
      Recom.: usa la palabra hoy en una frase real con tu pareja.<br>
      Ejemplo: <em>"Oggi è stato un giorno tranquillo."</em>
    </p>
  `;

  missionContentEl.appendChild(wrapper);

  if (existingResponse?.data) {
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
        <label class="option-card" data-index="${index}" for="${id}">
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

  const optionCards = wrapper.querySelectorAll(".option-card");
  optionCards.forEach((card) => {
    card.addEventListener("change", () => highlightGapSelection(mission, card));
  });

  if (typeof existingResponse?.data?.selectedIndex === "number") {
    const radio = wrapper.querySelector(
      `input[name="gap-option"][value="${existingResponse.data.selectedIndex}"]`
    );
    if (radio) {
      radio.checked = true;
      highlightGapSelection(mission, radio.closest(".option-card"));
    }
  }
}

function highlightGapSelection(mission, card) {
  const selectedIndex = Number(card.dataset.index);
  const cards = document.querySelectorAll(".option-card");
  cards.forEach((c) => c.classList.remove("selected", "correct", "incorrect"));

  card.classList.add("selected");
  if (selectedIndex === mission.correctIndex) {
    card.classList.add("correct");
  } else {
    card.classList.add("incorrect");
  }
}

function renderSceneMission(mission, existingResponse) {
  const wrapper = document.createElement("div");
  wrapper.className = "language-row";

  const sceneHtml = mission.scenes
    .map(
      (scene, index) => `
        <div class="scene-card" data-index="${index}">
          <span class="scene-label">${scene.label}</span>
          <p class="mission-example">${scene.text}</p>
        </div>
      `
    )
    .join("");

  wrapper.innerHTML = `
    <span class="language-label">Escoge la escena cotidiana en italiano:</span>
    <div class="scene-grid">${sceneHtml}</div>
    <p class="mission-helper">Al elegir, te damos una frase extra para usar hoy.</p>
    <p class="mission-example" id="scene-suggestion">${mission.suggestion}</p>
  `;

  missionContentEl.appendChild(wrapper);

  const cards = wrapper.querySelectorAll(".scene-card");
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      cards.forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
    });
  });

  if (typeof existingResponse?.data?.selectedScene === "number") {
    const card = wrapper.querySelector(`.scene-card[data-index="${existingResponse.data.selectedScene}"]`);
    if (card) card.classList.add("selected");
  }
}

function renderDialogMission(mission, existingResponse) {
  const wrapper = document.createElement("div");
  wrapper.className = "language-row";

  wrapper.innerHTML = `
    <span class="language-label">Pequeño diálogo</span>
    <div class="dialog-grid">
      <div class="dialog-card">
        <strong>Tu frase en italiano</strong>
        <p class="mission-helper">${mission.promptIt}</p>
        <textarea id="dialog-it" placeholder="Scrivi qui la tua versione"></textarea>
      </div>
      <div class="dialog-card">
        <strong>Respuesta en español</strong>
        <p class="mission-helper">${mission.promptEs}</p>
        <textarea id="dialog-es" placeholder="Anotad la respuesta que usará tu pareja"></textarea>
      </div>
    </div>
    <p class="mission-example">${mission.helper}</p>
  `;

  missionContentEl.appendChild(wrapper);

  if (existingResponse?.data) {
    const { dialogIt, dialogEs } = existingResponse.data;
    const itEl = document.getElementById("dialog-it");
    const esEl = document.getElementById("dialog-es");
    if (dialogIt) itEl.value = dialogIt;
    if (dialogEs) esEl.value = dialogEs;
  }
}

function updateMissionStatus(existingResponse) {
  missionStatusEl.innerHTML = "";
  const dot = document.createElement("span");
  dot.className = "status-dot";

  const text = document.createElement("span");

  if (!existingResponse) {
    dot.classList.add("pending");
    text.textContent = "Pendiente: aún no has guardado nada para la misión de hoy en este dispositivo.";
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

  const dateKey = getDateKey();
  const base = {
    dateKey,
    missionType: currentMission.type,
    missionId: currentMission.id,
    missionMeta: currentMission.meta,
  };

  switch (currentMission.type) {
    case "frase-espejo": {
      const itEl = document.getElementById("mirror-it");
      const esEl = document.getElementById("mirror-es");
      return {
        ...base,
        data: {
          itText: itEl ? itEl.value.trim() : "",
          esText: esEl ? esEl.value.trim() : "",
        },
      };
    }
    case "palabra-del-dia": {
      const wordEl = document.getElementById("word-it");
      return {
        ...base,
        data: {
          word: wordEl ? wordEl.value.trim() : "",
        },
      };
    }
    case "completa-hueco": {
      const selected = document.querySelector('input[name="gap-option"]:checked');
      const selectedIndex = selected ? parseInt(selected.value, 10) : null;
      return {
        ...base,
        data: {
          selectedIndex,
        },
      };
    }
    case "elige-escena": {
      const selected = document.querySelector(".scene-card.selected");
      const selectedScene = selected ? parseInt(selected.dataset.index, 10) : null;
      return {
        ...base,
        data: { selectedScene },
      };
    }
    case "mini-dialogo": {
      const dialogIt = document.getElementById("dialog-it");
      const dialogEs = document.getElementById("dialog-es");
      return {
        ...base,
        data: {
          dialogIt: dialogIt ? dialogIt.value.trim() : "",
          dialogEs: dialogEs ? dialogEs.value.trim() : "",
        },
      };
    }
    default:
      return base;
  }
}

function onSaveResponse() {
  const resp = collectResponseForCurrentMission();
  if (!resp) return;

  const todayKey = getDateKey();
  const all = loadResponses();
  all[todayKey] = resp;
  saveResponses(all);
  updateMissionStatus(resp);
  renderHistory();
}

function onClearResponse() {
  const todayKey = getDateKey();
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
    const key = getDateKey(day);

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
      stateLabel.textContent = getMissionTypeLabel(all[key].missionType);
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

  missionCard.classList.remove("hidden");
  loadMissionForToday();
});

// ---------------------------
// Inicialización
// ---------------------------

function loadMissionForToday() {
  currentMission = getMissionForToday();
  const todayKey = getDateKey();
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
  missionCard.classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", init);
