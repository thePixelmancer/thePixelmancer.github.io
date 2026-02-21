// ─── Modal DOM injection ──────────────────────────────────────────────────────

function createModal() {
  const modal = document.createElement("div");
  modal.id = "portfolioModal";
  modal.className = "fixed inset-0 bg-black/80 flex items-center justify-center z-50 hidden p-4";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "modalTitle");

  modal.innerHTML = `
    <div class="bg-dark-800 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">

      <header class="flex-shrink-0 flex justify-between items-center p-4 border-4 border-dark-700 bg-dark-900">
        <h3 id="modalTitle" class="text-xl font-semibold text-gray-100">Project Details</h3>
        <button
          type="button"
          onclick="closeModal()"
          class="text-gray-400 hover:text-gray-100 transition-colors text-2xl leading-none"
          aria-label="Close modal">
          ✕
        </button>
      </header>

      <div class="modal-body flex-1 min-h-0 overflow-y-auto p-6">
        <img id="modalImage" src="" alt="" class="w-full h-auto object-cover rounded-lg border-3 border-dark-700 mb-6" />

        <div class="mb-6">
          <h4 id="modalProjectTitle" class="text-2xl font-bold mb-2"></h4>
          <p id="modalProjectDescription" class="text-base mb-4"></p>
        </div>

        <dl id="modalMetadata" class="grid grid-cols-2 gap-3"></dl>
      </div>

      <footer class="flex-shrink-0 flex justify-end gap-4 p-4 bg-dark-900 border-4 border-dark-700">
        <button type="button" class="button-purple w-auto m-0">View Project</button>
        <button type="button" class="button w-auto m-0" onclick="closeModal()">Close</button>
      </footer>

    </div>
  `;

  document.body.appendChild(modal);

  // Close on backdrop click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

// ─── Open / close ─────────────────────────────────────────────────────────────

function openModal(cardElement) {
  const title = cardElement.querySelector("h3").textContent.trim();
  const imageSrc = cardElement.querySelector("img").src;
  const imageAlt = cardElement.querySelector("img").alt;
  const projectType = cardElement.querySelectorAll("p")[0].textContent.trim();
  const description = cardElement.querySelectorAll("p")[1].textContent.trim();

  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalImage").src = imageSrc;
  document.getElementById("modalImage").alt = imageAlt;
  document.getElementById("modalProjectTitle").textContent = title;
  document.getElementById("modalProjectDescription").textContent = description;

  const metadata = {
    Type: projectType,
    Description: description,
    Image: imageAlt,
    Project: "CastleBuild",
  };

  const metadataContainer = document.getElementById("modalMetadata");
  metadataContainer.innerHTML = "";

  for (const [key, value] of Object.entries(metadata)) {
    const item = document.createElement("div");
    item.className = "card p-3 flex flex-col";
    item.innerHTML = `
      <span class="text-gray-400 text-sm">${key}:</span>
      <span class="text-fuchsia-300">${value}</span>
    `;
    metadataContainer.appendChild(item);
  }

  document.getElementById("portfolioModal").classList.remove("hidden");
  document.getElementById("portfolioModal").classList.add("flex");
}

function closeModal() {
  document.getElementById("portfolioModal").classList.add("hidden");
  document.getElementById("portfolioModal").classList.remove("flex");
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", createModal);
