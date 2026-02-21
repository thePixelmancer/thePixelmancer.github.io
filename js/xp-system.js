// XP System Configuration
const XP_CONFIG = {
  CONTRIBUTIONS_PER_LEVEL: 100, // 100 contributions = 1 level
  XP_BAR_HIGH_THRESHOLD: 80, // Percentage for purple bar color
  XP_BAR_MEDIUM_THRESHOLD: 50, // Percentage for blue bar color
};

// GitHub XP System
async function loadGitHubXP() {
  try {
    const username = "thePixelmancer";

    const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}`);

    if (!response.ok) {
      throw new Error("Failed to fetch contributions");
    }

    const data = await response.json();

    let totalContributions = 0;

    // Sum up all years
    if (data.total) {
      Object.values(data.total).forEach((yearCount) => {
        totalContributions += yearCount;
      });
    }

    // Calculate XP and level
    const xpData = calculateXP(totalContributions);

    // Update UI
    updateXPBar(xpData.currentXP, xpData.xpForNextLevel);
    updateLevel(xpData.level);
  } catch (error) {
    console.error("Error fetching GitHub data:", error);
    // Fallback to demo data
    const fallbackXP = calculateXP(50);
    updateXPBar(fallbackXP.currentXP, fallbackXP.xpForNextLevel);
    updateLevel(fallbackXP.level);
  }
}

function calculateXP(contributions) {
  // Simple formula: every 100 contributions = 1 level
  const level = Math.floor(contributions / XP_CONFIG.CONTRIBUTIONS_PER_LEVEL) + 1;
  const contributionsForCurrentLevel = (level - 1) * XP_CONFIG.CONTRIBUTIONS_PER_LEVEL;
  const contributionsIntoCurrentLevel = contributions - contributionsForCurrentLevel;
  const currentXP = contributionsIntoCurrentLevel;
  const xpForNextLevel = XP_CONFIG.CONTRIBUTIONS_PER_LEVEL;

  return {
    level: level,
    currentXP: currentXP,
    xpForNextLevel: xpForNextLevel,
    totalXP: contributions,
    contributions: contributions,
  };
}

function updateXPBar(currentXP, xpForNextLevel) {
  const xpBar = document.getElementById("xpBar");
  const xpText = document.getElementById("xpText");

  if (xpBar && xpText) {
    const percentage = Math.min(100, (currentXP / xpForNextLevel) * 100);
    xpBar.style.width = `${percentage}%`;

    // Change color based on XP progress
    if (percentage > XP_CONFIG.XP_BAR_HIGH_THRESHOLD) {
      xpBar.className = "h-full bg-gradient-to-r from-purple-500 to-pink-400 transition-all duration-1000";
    } else if (percentage > XP_CONFIG.XP_BAR_MEDIUM_THRESHOLD) {
      xpBar.className = "h-full bg-gradient-to-r from-blue-500 to-purple-400 transition-all duration-1000";
    } else {
      xpBar.className = "h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-1000";
    }

    xpText.textContent = `XP: ${currentXP} / ${xpForNextLevel}`;
  }
}

function updateLevel(level) {
  const levelElement = document.getElementById("class-title");
  if (levelElement) {
    levelElement.textContent = `Lvl ${level} Pixelmancer`;
  }
}

// Start animation when page loads
document.addEventListener("DOMContentLoaded", () => {
  loadGitHubXP();
});
