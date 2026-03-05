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

  // Map colorClass to explicit hover classes
  const getHoverClasses = (colorClass) => {
    switch (colorClass) {
      case "purple":
        return {
          circle: "group-hover:bg-purple-400",
          title: "group-hover:text-purple-400",
          marker: "text-purple-400"
        };
      case "blue":
        return {
          circle: "group-hover:bg-blue-400",
          title: "group-hover:text-blue-400",
          marker: "text-blue-400"
        };
      case "yellow":
        return {
          circle: "group-hover:bg-yellow-400",
          title: "group-hover:text-yellow-400",
          marker: "text-yellow-400"
        };
      default:
        return {
          circle: "",
          title: "",
          marker: ""
        };
    }
  };

  const hoverClasses = getHoverClasses(item.colorClass);
  const markerBadge = item.markerText ? `<span class="marker ${hoverClasses.marker}">${item.markerText}</span>` : "<span></span>";
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
              <span class="circle bg-dark-700 ${hoverClasses.circle}" aria-hidden="true"></span>
            </div>
          <div class="flex gap-4">  
            ${imageElement}
            <div class="flex flex-col gap-1">
              <h3 class="text-md font-bold ${hoverClasses.title} transition-colors">${item.title}</h3>
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
