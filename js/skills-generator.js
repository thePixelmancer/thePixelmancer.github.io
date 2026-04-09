/**
 * Skills Generator — Ability list layout
 * Two columns of clickable skill rows; click opens spellbook modal.
 */

let skillsData = null;

const PATH_CONFIG = {
  development: {
    listId:      "dev-skill-list",
    color:       "#60a5fa",
    colorFaint:  "rgba(96,165,250,0.15)",
    colorBorder: "rgba(96,165,250,0.5)",
    colorText:   "#93c5fd",
    accentBg:    "bg-blue-500",
  },
  art: {
    listId:      "art-skill-list",
    color:       "#e879f9",
    colorFaint:  "rgba(232,121,249,0.15)",
    colorBorder: "rgba(232,121,249,0.5)",
    colorText:   "#f0abfc",
    accentBg:    "bg-fuchsia-500",
  },
};

// ─── Load ─────────────────────────────────────────────────────────────────────

async function loadSkills() {
  try {
    const res = await fetch("./data/skills.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    skillsData = await res.json();
    buildSpellbookModal();
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
      <button type="button"
              class="skill-tag w-full flex items-center gap-4 p-4 bg-dark-900 border-2 border-dark-700
                     transition-all duration-100 text-left hover:-translate-y-px"
              data-path="${pathKey}"
              data-skill="${skill.id}"
              aria-label="Open ${skill.label} spellbook"
              onmouseenter="this.style.borderColor='${cfg.colorBorder}';this.querySelector('.skill-label').style.color='${cfg.colorText}';this.style.boxShadow='var(--shadow-sharp), 0 0 10px ${cfg.colorFaint}'"
              onmouseleave="this.style.borderColor='';this.querySelector('.skill-label').style.color='';this.style.boxShadow=''">
        <div class="w-11 h-11 flex-shrink-0 flex items-center justify-center border-2"
             style="background:${cfg.colorFaint};border-color:${cfg.color};">
          <img src="${skill.icon ?? ""}" alt="" class="w-7 h-7 [image-rendering:pixelated]"
               onerror="this.style.display='none';this.nextElementSibling.classList.remove('hidden')" />
          <span class="hidden text-base" style="color:${cfg.color}">✦</span>
        </div>
        <span class="skill-label flex-1 text-xs text-gray-400 transition-colors duration-100">${skill.label}</span>
        <span class="text-gray-700 transition-colors duration-100">›</span>
      </button>
    `).join("");
  });
}

// ─── Spellbook Modal ──────────────────────────────────────────────────────────

function buildSpellbookModal() {
  if (document.getElementById("spellbookModal")) return;

  const style = document.createElement("style");
  style.textContent = `
    .scroll-content-scrollbar::-webkit-scrollbar { width: 8px; }
    .scroll-content-scrollbar::-webkit-scrollbar-track { background: rgb(17,24,40); }
    .scroll-content-scrollbar::-webkit-scrollbar-thumb { background: rgb(55,65,81); border-radius: 2px; }
    .scroll-content-scrollbar::-webkit-scrollbar-thumb:hover { background: rgb(75,85,99); }
  `;
  document.head.appendChild(style);

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
        <button type="button" onclick="closeSpellbook()"
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
  modal.addEventListener("click", (e) => { if (e.target === modal) closeSpellbook(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSpellbook(); });

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
          <img src="${spell.icon}" alt="" class="w-full h-full object-cover [image-rendering:pixelated]"
               onerror="this.style.display='none';this.nextElementSibling.classList.remove('hidden')"/>
          <span class="hidden text-xl text-gray-600">✦</span>
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

  const modal = document.getElementById("spellbookModal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeSpellbook() {
  const modal = document.getElementById("spellbookModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", loadSkills);
