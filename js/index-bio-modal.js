document.addEventListener("DOMContentLoaded", async () => {
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

  // Populate the lore content div
  const loreContent = document.getElementById("lore-content");
  if (loreContent) {
    loreContent.innerHTML = lore.paragraphs
      .map((p) => `<p class="text-xs text-gray-400 leading-relaxed">${p}</p>`)
      .join("");
  }

  // Wire expand toggle
  const expandBtn = document.getElementById("lore-expand-btn");
  if (expandBtn && loreContent) {
    expandBtn.addEventListener("click", () => {
      const isOpen = expandBtn.getAttribute("aria-expanded") === "true";
      if (isOpen) {
        loreContent.classList.add("hidden");
        loreContent.classList.remove("flex");
        expandBtn.setAttribute("aria-expanded", "false");
        expandBtn.textContent = "READ LORE \u25bc";
      } else {
        loreContent.classList.remove("hidden");
        loreContent.classList.add("flex");
        expandBtn.setAttribute("aria-expanded", "true");
        expandBtn.textContent = "CLOSE \u25b2";
      }
    });
  }
});

