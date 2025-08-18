// options.js — manages profile + API key + FIELD-LEVEL toggles in chrome.storage.sync
// Global Enable/Disable All removed by request. Group-level All on/off retained.
// Fields required by the popup are forced on and disabled.

// Field definitions grouped by part
const FIELD_GROUPS = {
  snippet: [
    ["title","Title"],
    ["description","Description"],
    ["channelId","Channel ID"],
    ["channelTitle","Channel title"],
    ["publishedAt","Published at"],
    ["tags","Tags"],
    ["thumbnails","Thumbnails"],
    ["categoryId","Category ID"],
    ["defaultLanguage","Default language"],
    ["defaultAudioLanguage"," "],
    ["liveContent","Live content flag"]
  ],
  contentDetails: [
    ["durationSeconds"," "],
    ["definition","Definition (sd/hd)"],
    ["caption","Has captions"],
    ["regionRestriction","Region restriction"],
    ["contentRating","Content rating"]
  ],
  statistics: [
    ["viewCount","View count"],
    ["likeCount","Like count"],
    ["commentCount","Comment count"]
  ],
  status: [
    ["madeForKids","Made for kids"]
  ],
  topicDetails: [
    ["topicCategories","Topic categories"]
  ]
};

// Fields the popup relies on for display/filters
const POPUP_REQUIRED_FIELDS = new Set([
  "title",
  "channelTitle",
  "thumbnails",
  "publishedAt",
  "durationSeconds",
  "madeForKids"
]);

const DEFAULT_PREFS = {
  apiKey: "",
  profile: "Child",
  fieldPrefs: Object.fromEntries(Object.entries(FIELD_GROUPS).flatMap(([part, fields]) =>
    fields.map(([k]) => [k, true])
  )),
  enrichment: {
    categoryName: true,
    channelBasics: false
  }
};

function flashStatus(msg){
  const el = document.getElementById('status');
  if(!el) return;
  el.textContent = msg;
  el.classList.add('ok');
  setTimeout(()=>{el.textContent=''; el.classList.remove('ok');}, 1200);
}

function buildFieldCards(container) {
  container.innerHTML = "";
  for (const [part, fields] of Object.entries(FIELD_GROUPS)) {
    const card = document.createElement("div");
    card.className = "card";
    const h = document.createElement("h3");
    h.innerHTML = `${part} <span class="pill">part</span>`;

    const actions = document.createElement("div");
    actions.className = "group-actions";
    const btnAll = document.createElement("button");
    btnAll.type = "button";
    btnAll.textContent = "All on";
    btnAll.addEventListener("click", () => { setGroup(part, true); saveCfg(); flashStatus(`Enabled all in ${part}`); });
    const btnNone = document.createElement("button");
    btnNone.type = "button";
    btnNone.textContent = "All off";
    btnNone.addEventListener("click", () => { setGroup(part, false); saveCfg(); flashStatus(`Disabled all in ${part}`); });
    h.appendChild(actions);
    actions.appendChild(btnAll);
    actions.appendChild(btnNone);

    card.appendChild(h);

    for (const [key, label] of fields) {
      const row = document.createElement("label");
      row.className = "chk";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.id = `f_${key}`;
      if (POPUP_REQUIRED_FIELDS.has(key)) {
        input.disabled = true;
        input.dataset.required = "1";
        input.checked = true; // required show checked immediately
      }
      row.appendChild(input);
      const span = document.createElement("span");
      span.textContent = `${label} (${key})${POPUP_REQUIRED_FIELDS.has(key) ? " — Required" : ""}`;
      row.appendChild(span);
      card.appendChild(row);
    }
    container.appendChild(card);
  }
}

function setCheckbox(el, val) {
  if (!el) return;
  el.indeterminate = false;
  el.checked = !!val;
  try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch(_) {}
}

function setGroup(part, value) {
  for (const [key] of FIELD_GROUPS[part]) {
    const el = document.getElementById(`f_${key}`);
    if (!el) continue;
    if (el.dataset.required === "1") { setCheckbox(el, true); continue; }
    setCheckbox(el, value);
  }
}

function loadCfg() {
  chrome.storage.sync.get(DEFAULT_PREFS, (cfg) => {
    document.getElementById("apiKey").value = cfg.apiKey || "";
    document.getElementById("profile").value = cfg.profile || "Child";

    const fp = { ...DEFAULT_PREFS.fieldPrefs, ...(cfg.fieldPrefs || {}) };

    // Ensure required popup fields are always enabled in storage
    for (const key of POPUP_REQUIRED_FIELDS) {
      fp[key] = true;
    }

    for (const key of Object.keys(fp)) {
      const el = document.getElementById(`f_${key}`);
      if (!el) continue;
      setCheckbox(el, !!fp[key]);
    }

    const e = { ...DEFAULT_PREFS.enrichment, ...(cfg.enrichment || {}) };
    document.getElementById("e_categoryName").checked = !!e.categoryName;
    document.getElementById("e_channelBasics").checked = !!e.channelBasics;
  });
}

function collectFieldPrefs() {
  const out = {};
  for (const [part, fields] of Object.entries(FIELD_GROUPS)) {
    for (const [key] of fields) {
      const el = document.getElementById(`f_${key}`);
      out[key] = (el?.dataset.required === "1") ? true : !!(el && el.checked);
    }
  }
  return out;
}

function saveCfg() {
  const apiKey = document.getElementById("apiKey").value.trim();
  const profile = document.getElementById("profile").value.trim() || "Child";
  const fieldPrefs = collectFieldPrefs();
  const enrichment = {
    categoryName: document.getElementById("e_categoryName").checked,
    channelBasics: document.getElementById("e_channelBasics").checked
  };

  chrome.storage.sync.set({ apiKey, profile, fieldPrefs, enrichment }, () => {
    chrome.runtime.sendMessage({ type: "YTL_SET_CONFIG", apiKey, profile, fieldPrefs, enrichment }, () => {});
    flashStatus("Saved.");
  });
}

document.addEventListener('DOMContentLoaded', () => {
  buildFieldCards(document.getElementById("fieldCards"));
  loadCfg();
  document.getElementById('save').addEventListener('click', (e) => { e.preventDefault(); saveCfg(); });
});
