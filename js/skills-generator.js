/**
 * Skills Generator — Ability list layout
 * Two columns of clickable skill rows; click opens spellbook modal.
 */

let skillsData = null;
let spellbookHandlersAttached = false;
let spellbookModalController = null;

const PATH_CONFIG = {
  development: {
    listId: "dev-skill-list",
    accentBg: "bg-blue-500",
    iconBgClass: "bg-blue-500/15",
    iconBorderClass: "border-blue-400",
    iconTextClass: "text-blue-300",
    buttonToneClass: "hover:border-blue-400/70 hover:shadow-[var(--shadow-sharp),0_0_10px_rgba(96,165,250,0.15)]",
    labelToneClass: "group-hover:text-blue-300",
  },
  art: {
    listId: "art-skill-list",
    accentBg: "bg-fuchsia-500",
    iconBgClass: "bg-fuchsia-500/15",
    iconBorderClass: "border-fuchsia-400",
    iconTextClass: "text-fuchsia-300",
    buttonToneClass: "hover:border-fuchsia-400/70 hover:shadow-[var(--shadow-sharp),0_0_10px_rgba(232,121,249,0.15)]",
    labelToneClass: "group-hover:text-fuchsia-300",
  },
};

// ─── Load ─────────────────────────────────────────────────────────────────────

async function loadSkills() {
  try {
    skillsData = await window.AngeloCore.loadJSON("./data/skills.json");
    buildSpellbookModal();
    attachSkillIconFallbackHandler();
    renderAllPaths();
  } catch (err) {
    console.error("[Skills] load failed:", err);
  }
}

// ─── Render skill rows ────────────────────────────────────────────────────────

function renderAllPaths() {
  Object.entries(skillsData).forEach(([pathKey, path]) => {
    const cfg = PATH_CONFIG[pathKey];
    if (!cfg) return;
    const container = document.getElementById(cfg.listId);
    if (!container) return;

    container.innerHTML = path.skills.map((skill) => `
      <button type="button" class="skill-tag group ${cfg.buttonToneClass}"
              data-path="${pathKey}"
              data-skill="${skill.id}"
              aria-label="Open ${skill.label} spellbook">
        <div class="w-11 h-11 flex-shrink-0 flex items-center justify-center border-2 ${cfg.iconBgClass} ${cfg.iconBorderClass}">
          <img src="${skill.icon ?? ""}" alt="" class="skill-icon-image w-7 h-7 [image-rendering:pixelated]" />
          <span class="skill-icon-fallback hidden text-base ${cfg.iconTextClass}">✦</span>
        </div>
        <span class="skill-label flex-1 text-xs text-gray-400 transition-colors duration-100 ${cfg.labelToneClass}">${skill.label}</span>
        <span class="text-gray-700 transition-colors duration-100">›</span>
      </button>
    `).join("");
  });
}

function attachSkillIconFallbackHandler() {
  if (spellbookHandlersAttached) return;
  spellbookHandlersAttached = true;

  document.addEventListener(
    "error",
    (event) => {
      const img = event.target;
      if (!(img instanceof HTMLImageElement) || !img.classList.contains("skill-icon-image")) return;
      img.classList.add("hidden");
      const fallback = img.nextElementSibling;
      if (fallback) fallback.classList.remove("hidden");
    },
    true
  );
}

// ─── Spellbook Modal ──────────────────────────────────────────────────────────

function buildSpellbookModal() {
  if (document.getElementById("spellbookModal")) return;

  const modal = document.createElement("div");
  modal.id = "spellbookModal";
  modal.className = "fixed inset-0 bg-black/80 flex items-center justify-center z-50 hidden p-4";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "spellbookTitle");

  modal.innerHTML = `
    <div class="w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-gray-200">
      <header class="flex justify-between items-center px-6 py-4 border-b-4 border-dark-700 bg-dark-900 shadow-sharp">
        <div class="flex items-center gap-3">
          <span id="spellbookIcon" class="text-xl text-amber-300" aria-hidden="true">✦</span>
          <div>
            <h3 id="spellbookTitle" class="font-title text-base text-amber-300"></h3>
            <p id="spellbookPath" class="text-xs mt-0.5 uppercase tracking-widest text-gray-500"></p>
          </div>
        </div>
        <button type="button"
          data-modal-close
                class="font-title text-xs px-3 py-1 text-gray-400 hover:text-gray-100 transition-colors"
                aria-label="Close spellbook">
          ✕ Close
        </button>
      </header>
      <div id="spellbookContent" class="scroll-content-scrollbar flex-1 overflow-y-auto px-8 py-6 bg-dark-800"></div>
      <footer class="px-6 py-4 border-t-4 border-dark-700 bg-dark-900"></footer>
    </div>
  `;

  document.body.appendChild(modal);
  spellbookModalController = window.AngeloCore.createModalController({
    modalId: "spellbookModal",
  });
  spellbookModalController.attachListeners();

  document.addEventListener("click", (e) => {
    const tag = e.target.closest(".skill-tag");
    if (tag) openSpellbook(tag.dataset.path, tag.dataset.skill);
  });
}

function openSpellbook(pathKey, skillId) {
  if (!skillsData) return;
  const path  = skillsData[pathKey];
  const skill = path?.skills.find((s) => s.id === skillId);
  if (!path || !skill) return;

  const cfg = PATH_CONFIG[pathKey];
  const accentColor = cfg?.accentBg ?? "bg-blue-500";

  document.getElementById("spellbookIcon").textContent  = path.icon;
  document.getElementById("spellbookTitle").textContent = skill.label;
  document.getElementById("spellbookPath").textContent  = path.label;

  document.getElementById("spellbookContent").innerHTML = skill.spells
    .map((spell) => `
      <div class="flex items-start gap-4 py-4 border-b border-dark-700 last:border-b-0">
        <div class="w-12 h-12 flex-shrink-0 border-2 border-dark-700 bg-dark-900 flex items-center justify-center">
          <img src="${spell.icon}" alt="" class="skill-icon-image w-full h-full object-cover [image-rendering:pixelated]" />
          <span class="skill-icon-fallback hidden text-xl text-gray-600">✦</span>
        </div>
        <div class="flex flex-col gap-1.5 flex-1">
          <div class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 ${accentColor}"></span>
            <h4 class="font-title text-sm uppercase text-gray-100">${spell.title}</h4>
          </div>
          <p class="text-sm text-gray-400 leading-relaxed">${spell.description}</p>
        </div>
      </div>
    `)
    .join("");

  const scrollEl = document.getElementById("spellbookContent");
  if (scrollEl) scrollEl.scrollTop = 0;

  if (spellbookModalController) {
    spellbookModalController.open();
    return;
  }

  const modal = document.getElementById("spellbookModal");
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeSpellbook() {
  if (spellbookModalController) {
    spellbookModalController.close();
    return;
  }
  const modal = document.getElementById("spellbookModal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", loadSkills);
