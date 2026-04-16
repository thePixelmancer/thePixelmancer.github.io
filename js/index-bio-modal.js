function openLoreModal(lore) {
  const modal = document.getElementById("portfolioModal");
  if (!modal) return;

  const titleEl = document.getElementById("modalTitle");
  const imageEl = document.getElementById("modalImage");
  const projectTitleEl = document.getElementById("modalProjectTitle");
  const descriptionEl = document.getElementById("modalProjectDescription");
  const metadataEl = document.getElementById("modalMetadata");
  const modalFooter = modal.querySelector("footer");

  if (!titleEl || !imageEl || !projectTitleEl || !descriptionEl || !metadataEl) return;

  titleEl.textContent = "Lore Letter";
  projectTitleEl.textContent = lore.title || "Lore Letter";
  descriptionEl.innerHTML = lore.paragraphs
    .map((paragraph) => `<p class=\"text-sm text-gray-400 leading-relaxed mb-3\">${paragraph}</p>`)
    .join("");

  imageEl.src = "";
  imageEl.alt = "";
  imageEl.classList.add("hidden");

  metadataEl.innerHTML = "";
  metadataEl.classList.add("hidden");

  if (modalFooter) {
    modalFooter.classList.add("hidden");
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

document.addEventListener("DOMContentLoaded", async () => {
  const trigger = document.getElementById("home-avatar-trigger");
  if (!trigger || !window.BioProfile) return;

  let profileData;
  try {
    profileData = await window.BioProfile.loadBioData();
  } catch (error) {
    console.error("[Index] failed to load bio data:", error);
    profileData = null;
  }

  if (profileData?.stats) {
    window.BioProfile.renderStats(profileData.stats, "bio-stats");
  }

  const lore = window.BioProfile.getLore(profileData);

  trigger.addEventListener("click", () => {
    openLoreModal(lore);
  });
});
