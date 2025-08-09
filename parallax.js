const layers = document.querySelectorAll("body > div.fixed");

// Different movement strengths for each layer (bottom to top)
const movementFactors = [5, 10, 25]; // pixels max offset

window.addEventListener("mousemove", (e) => {
  // Calculate offset relative to center (range -1 to 1)
  const x = (e.clientX / window.innerWidth) * 2 - 1;
  const y = (e.clientY / window.innerHeight) * 2 - 1;

  layers.forEach((layer, index) => {
    const movement = movementFactors[index];
    // Move opposite to cursor movement for subtle parallax
    const translateX = -x * movement;
    const translateY = -y * movement;
    layer.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
  });
});
