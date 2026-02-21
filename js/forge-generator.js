async function loadForgeItems() {
  try {
    const response = await fetch("./data/forge-items.json");
    const forgeItems = await response.json();
    renderForgeItems(forgeItems);
  } catch (error) {
    console.error("Error loading forge items:", error);
  }
}

function renderForgeItems(forgeItems) {
  const container = document.getElementById("forge-items-container");
  if (!container) return;

  const itemsHTML = forgeItems.map((item) => createForgeItemHTML(item)).join("");
  container.innerHTML = itemsHTML;
}

function createForgeItemHTML(item) {
  // Extract dynamic class generation into constants
  const colorClass = item.colorClass || "";
  const circleHoverClass = colorClass ? `group-hover:bg-${colorClass.replace("text-", "")}` : "";
  const titleHoverClass = colorClass ? `group-hover:${colorClass}` : "";
  const markerBadge = item.markerText ? `<span class="marker ${colorClass}">${item.markerText}</span>` : "<span></span>";
  const imageElement =
    item.image ? `<img src="${item.image}" alt="" class="w-20 h-20 bg-gray-800 border-3 border-dark-700 flex-shrink-0 object-cover" />` : "";
  const footerElement = item.footer ? `<div class="flex items-center gap-2 text-sm mt-3">${item.footer}</div>` : "";

  // Build the card based on whether image is provided (horizontal layout)
  return `
      <article class="card group">
        <a href="${item.href}" class="block">
          <div class="mb-3">
            <div class="flex justify-between items-start">
              ${markerBadge}
              <span class="circle bg-dark-700 ${circleHoverClass}" aria-hidden="true"></span>
            </div>
          </div>
          <div class="flex gap-4">  
            ${imageElement}
            <div class="forge-content">
              <h3 class="text-xl mb-1 ${titleHoverClass} transition-colors">${item.title}</h3>
              <p class="text-base">${item.description}</p>
              ${footerElement}
            </div>
          </div>
        </a>
      </article>
    `;
}

// Initialize the forge generator when DOM is loaded
document.addEventListener("DOMContentLoaded", loadForgeItems);
