/**
 * Quest Generator
 * Builds journal cards from data/quests.json.
 * Lead quests span all columns with a full hero layout.
 * Filter buttons narrow by quest.roleType.
 */

let allQuests = [];

const ROLE_BADGE = {
  lead: { label: "Project Lead", classes: "bg-amber-900 text-amber-100 border-amber-600" },
  dev: { label: "Developer", classes: "bg-blue-900 text-blue-100 border-blue-600" },
  artist: { label: "Artist", classes: "bg-fuchsia-900 text-fuchsia-100 border-fuchsia-600" },
};

async function loadQuests() {
  try {
    const response = await fetch("./data/quests.json");
    allQuests = await response.json();
    renderQuests(allQuests);
    setupFilters();
  } catch (error) {
    console.error("[Quests] load failed:", error);
  }
}

function renderQuests(quests) {
  const container = document.getElementById("quests-container");
  if (!container) return;
  container.innerHTML = quests.map(createQuestHTML).join("");

  container.addEventListener("click", (e) => {
    const card = e.target.closest("[data-quest-index]");
    if (!card) return;
    const quest = allQuests[parseInt(card.dataset.questIndex, 10)];
    if (quest && quest.featured !== "superhero") openQuestModal(quest);
  });
}

function createQuestHTML(quest, index) {
  const isHero = quest.featured === "superhero";
  const isFeatured = quest.featured === "hero";
  const badge = ROLE_BADGE[quest.roleType] ?? ROLE_BADGE.dev;
  const roleBadge = `<span class="px-2 py-1 font-title uppercase border text-xs inline-flex items-center ${badge.classes}">${badge.label}</span>`;

  if (isHero) {
    // Hero: image left (2 cols, 16:9) + info right (1 col), top-aligned
    const heroImageEl =
      quest.image ?
        `<div class="relative overflow-hidden border-3 border-dark-700 aspect-video">
          <img src="${quest.image}" alt="${quest.alt}"
               class="w-full h-full bg-gray-800 object-cover group-hover:scale-105 transition-transform duration-200" />
         </div>`
      : `<div class="aspect-video bg-dark-900/60 border-3 border-dark-700"></div>`;

    return `
      <article class="card-paper group cursor-pointer p-6 col-span-1 md:col-span-2 xl:col-span-3"
               data-quest-index="${index}">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="md:col-span-2">${heroImageEl}</div>
          <div class="flex flex-col gap-3 pt-1">
            <div class="flex items-center justify-between gap-3">
              ${roleBadge}
              <span class="project-type-label">${quest.type}</span>
            </div>
            <h3 class="font-title text-base text-stone-800 group-hover:text-amber-800 transition-colors leading-relaxed">${quest.title}</h3>
            ${quest.description ? `<p class="text-xs text-stone-600 leading-relaxed">${quest.description}</p>` : ""}
            <div class="flex flex-col gap-1 mt-1">
              ${[
                ["Type", quest.type || "-"],
                ["Studio", quest.project || "-"],
                ["Role", badge.label],
                ["Date", quest.date || "Ongoing"],
              ]
                .map(
                  ([k, v]) => `
                <div class="flex items-center justify-between gap-2 border-b border-stone-400/50 pb-1">
                  <span class="text-[8px] tracking-widest text-stone-500 uppercase">${k}</span>
                  <span class="text-xs text-stone-700">${v}</span>
                </div>`,
                )
                .join("")}
            </div>
            ${
              quest.link && quest.link !== "#" ?
                `<a href="${quest.link}" target="_blank" rel="noopener noreferrer"
                    class="mt-auto button-purple text-center no-underline"
                    onclick="event.stopPropagation()">VIEW PROJECT</a>`
              : ""
            }
          </div>
        </div>
      </article>`;
  }

  if (isFeatured) {
    // Featured (medium): 2-col span, image + title + badge only
    const featImageEl =
      quest.image ?
        `<div class="relative overflow-hidden border-3 border-dark-700 aspect-video w-full">
          <img src="${quest.image}" alt="${quest.alt}"
               class="w-full h-full bg-gray-800 object-cover group-hover:scale-105 transition-transform duration-200" />
         </div>`
      : "";

    return `
      <article class="card-paper group cursor-pointer flex flex-col gap-3 p-5 col-span-1 xl:col-span-2"
               data-quest-index="${index}">
        ${featImageEl}
        <div class="flex items-center justify-between gap-3">
          <h3 class="font-title text-sm text-stone-800 group-hover:text-amber-800 transition-colors">${quest.title}</h3>
          ${roleBadge}
        </div>
      </article>`;
  }

  const imageEl =
    quest.image ?
      `<div class="relative overflow-hidden border-3 border-dark-700 aspect-video w-full">
        <img src="${quest.image}" alt="${quest.alt}"
             class="w-full h-full bg-gray-800 object-cover group-hover:scale-105 transition-transform duration-200" />
       </div>`
    : "";

  return `
    <article class="card-paper group cursor-pointer flex flex-col gap-4 p-6"
             data-quest-index="${index}">
      ${imageEl}
      <div class="flex flex-wrap justify-between items-center gap-2">
        ${roleBadge}
        <span class="project-type-label">${quest.type}</span>
      </div>
      <div class="flex flex-col gap-1">
        <h3 class="font-title text-base text-stone-800 group-hover:text-amber-800 transition-colors">${quest.title}</h3>
        <p class="text-sm text-stone-600">${quest.alt}</p>
      </div>
    </article>`;
}

function setupFilters() {
  const filterBtns = document.querySelectorAll(".journal-filter");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.dataset.filter;
      const filtered = filter === "all" ? allQuests : allQuests.filter((q) => q.roleType === filter);
      renderQuests(filtered);
    });
  });
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function openQuestModal(quest) {
  document.getElementById("modalTitle").textContent = quest.title;
  document.getElementById("modalImage").src = quest.image || "";
  document.getElementById("modalImage").alt = quest.alt || "";
  document.getElementById("modalProjectTitle").textContent = quest.title;
  document.getElementById("modalProjectDescription").textContent = quest.description;

  const badge = ROLE_BADGE[quest.roleType] ?? ROLE_BADGE.dev;
  const metadata = {
    Type: quest.type || "Unknown",
    Project: quest.project || "Unknown",
    Role: badge.label,
    Date: quest.date || "Ongoing",
  };

  const metadataContainer = document.getElementById("modalMetadata");
  metadataContainer.innerHTML = "";
  for (const [key, value] of Object.entries(metadata)) {
    const item = document.createElement("div");
    item.className = "card-nohover flex justify-between";
    item.innerHTML = `<span class="text-xs text-gray-500">${key}:</span><span class="text-xs text-fuchsia-300">${value}</span>`;
    metadataContainer.appendChild(item);
  }

  const viewBtn = document.querySelector(".button-purple");
  if (viewBtn) viewBtn.onclick = () => quest.link && quest.link !== "#" && window.open(quest.link, "_blank");

  document.getElementById("portfolioModal").classList.remove("hidden");
  document.getElementById("portfolioModal").classList.add("flex");
}

function closeModal() {
  document.getElementById("portfolioModal").classList.add("hidden");
  document.getElementById("portfolioModal").classList.remove("flex");
}

document.addEventListener("DOMContentLoaded", loadQuests);
