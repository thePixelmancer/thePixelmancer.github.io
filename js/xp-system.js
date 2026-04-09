// ─── HP Bar ───────────────────────────────────────────────────────────────────
// Simple full HP — always 100/100.

function initHP() {
  const bar  = document.getElementById("xpBar");
  const text = document.getElementById("xpText");
  if (bar)  bar.style.width = "100%";
  if (text) text.textContent = "HP  100 / 100";
}

document.addEventListener("DOMContentLoaded", initHP);

// ─── GitHub XP (disabled — kept for future use) ───────────────────────────────
/*
const XP_CONFIG = {
  CONTRIBUTIONS_PER_LEVEL: 100,
  XP_BAR_HIGH_THRESHOLD: 80,
  XP_BAR_MEDIUM_THRESHOLD: 50,
};

async function loadGitHubXP() {
  try {
    const username = "thePixelmancer";
    const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}`);
    if (!response.ok) throw new Error("Failed to fetch contributions");
    const data = await response.json();
    let totalContributions = 0;
    if (data.total) Object.values(data.total).forEach(y => totalContributions += y);
    const xpData = calculateXP(totalContributions);
    updateXPBar(xpData.currentXP, xpData.xpForNextLevel);
    updateLevel(xpData.level);
  } catch (error) {
    console.error("Error fetching GitHub data:", error);
    const fallbackXP = calculateXP(50);
    updateXPBar(fallbackXP.currentXP, fallbackXP.xpForNextLevel);
    updateLevel(fallbackXP.level);
  }
}

function calculateXP(contributions) {
  const level = Math.floor(contributions / XP_CONFIG.CONTRIBUTIONS_PER_LEVEL) + 1;
  const contributionsForCurrentLevel = (level - 1) * XP_CONFIG.CONTRIBUTIONS_PER_LEVEL;
  const currentXP = contributions - contributionsForCurrentLevel;
  return { level, currentXP, xpForNextLevel: XP_CONFIG.CONTRIBUTIONS_PER_LEVEL, totalXP: contributions };
}

function updateXPBar(currentXP, xpForNextLevel) {
  const xpBar  = document.getElementById("xpBar");
  const xpText = document.getElementById("xpText");
  if (xpBar && xpText) {
    const percentage = Math.min(100, (currentXP / xpForNextLevel) * 100);
    xpBar.style.width = `${percentage}%`;
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
  const el = document.getElementById("class-title");
  if (el) el.textContent = `Lvl ${level} Pixelmancer`;
}
*/
