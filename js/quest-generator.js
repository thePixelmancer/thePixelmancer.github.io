/**
 * Quest Generator
 * Builds journal cards from data/quests.json.
 * Lead quests span all columns with a full hero layout.
 * Filter buttons are generated from unified quest tags.
 */

let allQuests = [];
let activeFilter = "all";
let tagColorLookup = new Map();

const DEFAULT_BADGE_CLASSES = "bg-dark-800 text-gray-100 border-dark-700";

const TAG_BADGE_BY_COLOR = {
  amber: "bg-amber-900 text-amber-100 border-amber-600",
  blue: "bg-blue-900 text-blue-100 border-blue-600",
  fuchsia: "bg-fuchsia-900 text-fuchsia-100 border-fuchsia-600",
  green: "bg-green-900 text-green-100 border-green-600",
  purple: "bg-purple-900 text-purple-100 border-purple-600",
  orange: "bg-orange-900 text-orange-100 border-orange-600",
  gray: "bg-dark-800 text-gray-100 border-dark-700",
  white: "bg-dark-800 text-white border-white/60",
};

function normalizeTagName(name) {
  return String(name || "")
    .trim()
    .toLowerCase();
}

function normalizeTagEntry(tag) {
  if (typeof tag === "string") return { name: tag, primary: false };
  if (tag && typeof tag === "object") return { name: tag.name || "", primary: !!tag.primary, color: tag.color };
  return { name: "", primary: false };
}

function getTagColorName(tagName, explicitColor) {
  if (explicitColor) return explicitColor;
  const normalized = normalizeTagName(tagName);
  return tagColorLookup.get(normalized) || "white";
}

function getBadgeClasses(tagName, explicitColor) {
  const color = getTagColorName(tagName, explicitColor);
  return TAG_BADGE_BY_COLOR[color] || DEFAULT_BADGE_CLASSES;
}

function normalizeTag(tag) {
  return normalizeTagName(tag);
}

function getQuestTagObjects(quest) {
  return (quest.tags ?? []).map(normalizeTagEntry).filter((t) => t.name);
}

function getQuestTags(quest) {
  const tags = [];
  if (quest.team) tags.push(quest.team);
  tags.push(...getQuestTagObjects(quest).map((t) => t.name));
  return Array.from(new Set(tags.map(normalizeTag).filter(Boolean)));
}

function titleCaseTag(tag) {
  return String(tag || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function createSingleTagHTML(tag) {
  const classes = getBadgeClasses(tag.name, tag.color);
  return `<span class="px-2 py-1 font-title uppercase border text-xs inline-flex items-center ${classes}">${tag.name}</span>`;
}

function createTagBadgesHTML(quest) {
  const tags = getQuestTagObjects(quest);
  const primaryTag = tags.find((t) => t.primary) || tags[0];
  if (!primaryTag) return "";

  const secondaryTags = tags.filter((t) => t !== primaryTag);
  const separator = secondaryTags.length ? `<span class="text-dark-700 select-none mx-0.5">|</span>` : "";
  const secondaryHTML = secondaryTags.map(createSingleTagHTML).join("");

  return `${createSingleTagHTML(primaryTag)}${separator}${secondaryHTML}`;
}

function createQuestTitleStackHTML(quest) {
  return `
    <div class="flex flex-col gap-0.5">
      <h3 class="font-basic text-xl text-stone-800 group-hover:text-amber-800 transition-colors leading-tight font-semibold">${quest.title}</h3>
      <p class="font-title text-sm uppercase tracking-wide leading-tight text-stone-600">by ${quest.team || "Unknown"}</p>
      <p class="font-title text-xs leading-tight text-stone-500">${quest.date || "Ongoing"}</p>
    </div>`;
}

function createQuestDescriptionHTML(text, classes) {
  if (!text) return "";
  return `<p class="mt-2 ${classes}">${text}</p>`;
}

function readTagDefinitions(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.tags || [];
}

function setTagColorLookup(definitions) {
  const map = new Map();
  (definitions || []).forEach((entry) => {
    if (!entry?.name || !entry?.color) return;
    map.set(normalizeTagName(entry.name), String(entry.color).toLowerCase());
  });
  tagColorLookup = map;
}

async function loadQuests() {
  try {
    const [questsResponse, tagsResponse] = await Promise.all([fetch("./data/quests.json"), fetch("./data/tags.json")]);
    const payload = await questsResponse.json();
    const tagPayload = await tagsResponse.json();

    allQuests = Array.isArray(payload) ? payload : payload.quests || [];
    setTagColorLookup(readTagDefinitions(tagPayload));

    setupFilters();
    applyActiveFilter();
  } catch (error) {
    console.error("[Quests] load failed:", error);
  }
}

function renderQuests(quests) {
  const container = document.getElementById("quests-container");
  if (!container) return;
  container.innerHTML = quests.map((quest) => createQuestHTML(quest, allQuests.indexOf(quest))).join("");

  container.onclick = (e) => {
    const card = e.target.closest("[data-quest-index]");
    if (!card) return;
    const quest = allQuests[parseInt(card.dataset.questIndex, 10)];
    if (quest && quest.featured !== "superhero") openQuestModal(quest);
  };
}

function createQuestHTML(quest, index) {
  const isHero = quest.featured === "superhero";
  const isFeatured = quest.featured === "hero";
  const tagBadges = createTagBadgesHTML(quest);

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
            <div class="flex flex-wrap items-center gap-2">${tagBadges}</div>
            ${createQuestTitleStackHTML(quest)}
            ${createQuestDescriptionHTML(quest.description, "text-xs text-stone-600 leading-relaxed")}
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
          ${createQuestTitleStackHTML(quest)}
          <div class="flex flex-wrap items-center gap-2">${tagBadges}</div>
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
      <div class="flex flex-wrap items-center gap-2">${tagBadges}</div>
      ${createQuestTitleStackHTML(quest)}
      ${createQuestDescriptionHTML(quest.alt, "text-sm text-stone-600")}
    </article>`;
}

function getAllFilterTags() {
  const tags = new Set();
  allQuests.forEach((quest) => getQuestTags(quest).forEach((tag) => tags.add(tag)));
  return Array.from(tags).sort((a, b) => a.localeCompare(b));
}

function applyActiveFilter() {
  const filtered = activeFilter === "all" ? allQuests : allQuests.filter((q) => getQuestTags(q).includes(activeFilter));
  renderQuests(filtered);
}

function renderFilters() {
  const filterStrip = document.getElementById("journal-filters");
  if (!filterStrip) return;

  const tags = getAllFilterTags();
  const buttons = [
    `<button class="journal-filter ${activeFilter === "all" ? "active" : ""}" data-filter="all">All</button>`,
    ...tags.map((tag) => `<button class="journal-filter ${activeFilter === tag ? "active" : ""}" data-filter="${tag}">${titleCaseTag(tag)}</button>`),
  ];

  filterStrip.innerHTML = buttons.join("");
}

function setupFilters() {
  renderFilters();
  const filterStrip = document.getElementById("journal-filters");
  if (!filterStrip) return;

  filterStrip.addEventListener("click", (event) => {
    const btn = event.target.closest(".journal-filter");
    if (!btn) return;
    activeFilter = btn.dataset.filter || "all";
    renderFilters();
    applyActiveFilter();
  });
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function openQuestModal(quest) {
  document.getElementById("modalTitle").textContent = quest.title;
  document.getElementById("modalImage").src = quest.image || "";
  document.getElementById("modalImage").alt = quest.alt || "";
  document.getElementById("modalProjectTitle").textContent = quest.title;
  document.getElementById("modalProjectTeam").textContent = `by ${quest.team || "Unknown"}`;
  document.getElementById("modalProjectDate").textContent = quest.date || "Ongoing";
  document.getElementById("modalProjectDescription").textContent = quest.description;

  const tagBadges = createTagBadgesHTML(quest);
  const tagsContainer = document.getElementById("modalTags");
  tagsContainer.innerHTML = tagBadges;

  const viewBtn = document.querySelector("#portfolioModal .button-purple");
  if (viewBtn) viewBtn.onclick = () => quest.link && quest.link !== "#" && window.open(quest.link, "_blank");

  document.getElementById("portfolioModal").classList.remove("hidden");
  document.getElementById("portfolioModal").classList.add("flex");
}

document.addEventListener("DOMContentLoaded", loadQuests);
