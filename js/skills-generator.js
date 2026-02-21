async function loadSkills() {
  try {
    const response = await fetch("./data/skills.json");
    const skillsData = await response.json();
    renderSkills(skillsData);
  } catch (error) {
    console.error("Error loading skills:", error);
  }
}

function renderSkills(skillsData) {
  renderSkillCategory("development-skills-container", skillsData.development, "Development");
  renderSkillCategory("art-skills-container", skillsData.art, "Art & Design");
}

function renderSkillCategory(containerId, skills, categoryName) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <h3 class="text-gray-400 font-highlight text-base flex uppercase items-center gap-3 mb-3">
      <span class="circle ${categoryName === "Development" ? "bg-blue-400" : "bg-red-400"}" aria-hidden="true"></span>
      <span>${categoryName}</span>
    </h3>
    <div class="flex flex-wrap gap-2">
      ${skills.map((skill) => `<li class="card p-2 text-xs">${skill}</li>`).join("")}
    </div>
  `;
}

// Initialize the skills generator when DOM is loaded
document.addEventListener("DOMContentLoaded", loadSkills);
