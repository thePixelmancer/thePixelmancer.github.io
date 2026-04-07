async function loadQuests() {
  try {
    const response = await fetch("./data/quests.json");
    const quests = await response.json();
    renderQuests(quests);
  } catch (error) {
    console.error("Error loading quests:", error);
  }
}

function renderQuests(quests) {
  const container = document.getElementById("quests-container");
  if (!container) return;

  const questsHTML = quests.map((quest) => createQuestHTML(quest)).join("");
  container.innerHTML = questsHTML;
}

function createQuestHTML(quest) {
  // Extract dynamic class generation into constants
  const statusClass = quest.status === "completed" ? "text-green-400" : "text-yellow-400";
  const statusBadge =
    quest.status === "completed" ?
      `<span class="marker ${statusClass}">✓ Completed</span>`
    : `<span class="marker ${statusClass}">⚡ In Progress</span>`;
  const imageElement =
    quest.image ?
      `
      <div class="relative overflow-hidden border-3 border-dark-700 aspect-video">
        <img src="${quest.image}" alt="${quest.alt}" class="w-full h-full bg-gray-800 object-cover group-hover:scale-105 transition-transform duration-200" />
      </div>
    `
    : "";

  return `
      <article class="card group cursor-pointer flex flex-col gap-4 p-6" onclick="openQuestModal('${quest.title}', '${quest.alt}', '${quest.image}', '${quest.type}', '${quest.description}', '${quest.project}', '${quest.status}', '${quest.date}', '${quest.link}')">
        <div class="flex justify-between items-center">
          ${statusBadge}
          <span class="text-[9px] tracking-widest text-gray-500 uppercase">${quest.type}</span>
        </div>
        
        ${imageElement}
        
        <div class="quest-content flex flex-col gap-1">
          <h3 class="font-title text-base group-hover:text-amber-400 transition-colors">${quest.title}</h3>
          <p class="text-xs text-gray-500">${quest.alt}</p>
        </div>
      </article>
    `;
}

// Quest Modal Functions
function openQuestModal(title, alt, image, type, description, project, status, date, link) {
  // Update modal content with quest data
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalImage").src = image || "";
  document.getElementById("modalImage").alt = alt || "";
  document.getElementById("modalProjectTitle").textContent = title;
  document.getElementById("modalProjectDescription").textContent = description;

  // Update metadata with quest-specific data
  const metadata = {
    Type: type || "Unknown",
    Project: project || "Unknown",
    Status: status === "completed" ? "✓ Completed" : "⚡ In Progress",
    Date: date || "Ongoing",
  };

  const metadataContainer = document.getElementById("modalMetadata");
  metadataContainer.innerHTML = "";

  for (const [key, value] of Object.entries(metadata)) {
    const metadataItem = document.createElement("div");
    metadataItem.className = "card p-2 flex justify-between";
    metadataItem.innerHTML = `
      <span class="">${key}:</span>
      <span class="text-fuchsia-300">${value}</span>
    `;
    metadataContainer.appendChild(metadataItem);
  }

  // Update modal footer link
  const viewProjectBtn = document.querySelector(".button-purple");
  if (viewProjectBtn && link) {
    viewProjectBtn.onclick = () => window.open(link, "_blank");
  }

  // Show modal
  document.getElementById("portfolioModal").classList.remove("hidden");
  document.getElementById("portfolioModal").classList.add("flex");
}

function closeModal() {
  document.getElementById("portfolioModal").classList.add("hidden");
  document.getElementById("portfolioModal").classList.remove("flex");
}

// Initialize the quest generator when DOM is loaded
document.addEventListener("DOMContentLoaded", loadQuests);
