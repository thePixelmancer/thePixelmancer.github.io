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
  // Check if item is a divider (empty string)
  if (item === "divider") {
    return `<hr class="divider" />`;
  }

  // Extract dynamic class generation into constants
  const colorClass = item.colorClass || "";
  const circleHoverClass = colorClass ? `group-hover:bg-${colorClass.replace("text-", "")}` : "";
  const titleHoverClass = colorClass ? `group-hover:${colorClass}` : "";
  const markerBadge = item.markerText ? `<span class="marker ${colorClass}">${item.markerText}</span>` : "<span></span>";
  const imageElement =
    item.image ?
      `<img src="${item.image}" alt="" class="size-30 bg-gray-800 border-3 border-dark-700 flex-shrink-0 object-cover image-rendering-pixelated" />`
    : "";
  const footerElement = item.footer ? `<div class="flex mt-2 justify-end text-gray-400 text-xs">${item.footer}</div>` : "";

  // Build the card based on whether image is provided (horizontal layout)
  return `
      <article class="card group">
        <a href="${item.href}">
       
            <div class="flex justify-between items-start mb-3">
              ${markerBadge}
              <span class="circle bg-dark-700 ${circleHoverClass}" aria-hidden="true"></span>
            </div>
          <div class="flex gap-4">  
            ${imageElement}
            <div class="flex flex-col gap-1">
              <h3 class="text-md font-bold ${titleHoverClass} transition-colors">${item.title}</h3>
              <p class="text-sm text-gray-500">${item.description}</p>
              ${footerElement}
            </div>
          </div>
        </a>
      </article>
    `;
}

// Initialize the forge generator when DOM is loaded
document.addEventListener("DOMContentLoaded", loadForgeItems);
