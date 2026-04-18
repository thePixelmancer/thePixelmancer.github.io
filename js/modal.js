// ─── Modal DOM injection ──────────────────────────────────────────────────────

let portfolioModalController = null;

function createModal() {
  const modal = document.createElement("div");
  modal.id = "portfolioModal";
  modal.className = "fixed inset-0 bg-black/80 flex items-center justify-center z-50 hidden p-4";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "modalTitle");

  modal.innerHTML = `
    <div class="bg-dark-800 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">

      <header class="flex-shrink-0 flex justify-between items-center px-5 py-4 border-b-4 border-dark-700 bg-dark-900">
        <h3 id="modalTitle" class="font-title text-base text-gray-100">Project Details</h3>
        <button
          type="button"
          data-modal-close
          class="font-title text-xs px-3 py-1 text-gray-400 hover:text-gray-100 transition-colors"
          aria-label="Close modal">
          ✕ Close
        </button>
      </header>

      <div class="flex-1 min-h-0 overflow-y-auto p-6">
        <img id="modalImage" src="" alt="" class="w-full h-auto object-cover border-3 border-dark-700 mb-5" />

        <div class="mb-5 flex flex-col gap-2">
          <h4 id="modalProjectTitle" class="font-basic text-2xl text-gray-100 font-semibold leading-snug"></h4>
          <p id="modalProjectTeam" class="font-title text-xs uppercase tracking-wide text-gray-300"></p>
          <p id="modalProjectDate" class="text-xs text-gray-500"></p>
          <p id="modalProjectDescription" class="text-sm text-gray-400 leading-relaxed"></p>
        </div>

        <div id="modalTags" class="flex flex-wrap gap-2"></div>
      </div>

      <footer class="flex-shrink-0 flex justify-end gap-3 px-5 py-4 bg-dark-900 border-t-4 border-dark-700">
        <button type="button" class="button-purple w-auto m-0 px-5">View Project</button>
        <button type="button" class="button w-auto m-0 px-5" data-modal-close>Close</button>
      </footer>

    </div>
  `;

  document.body.appendChild(modal);

  portfolioModalController = window.AngeloCore.createModalController({
    modalId: "portfolioModal",
  });
  portfolioModalController.attachListeners();
}

function closeModal() {
  if (portfolioModalController) {
    portfolioModalController.close();
    return;
  }
  const modal = document.getElementById("portfolioModal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function openModal() {
  if (portfolioModalController) {
    portfolioModalController.open();
    return;
  }
  const modal = document.getElementById("portfolioModal");
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

window.closeModal = closeModal;
window.openModal = openModal;
window.getPortfolioModalController = () => portfolioModalController;

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", createModal);
