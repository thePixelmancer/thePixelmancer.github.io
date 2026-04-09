// Create parallax layers dynamically
function createParallaxLayers() {
  const body = document.body;

  // Layer 1 - Back
  const layer1 = document.createElement("div");
  layer1.className = "fixed inset-0 z-[1] origin-center";
  layer1.innerHTML = `<img src="images/bgz0.png" alt="" class="absolute inset-0 w-full h-full object-cover" />`;

  // Layer 2 - Middle
  const layer2 = document.createElement("div");
  layer2.className = "fixed inset-0 z-[2] origin-center";
  layer2.innerHTML = `<img src="images/bgz1.png" alt="" class="absolute inset-0 w-full h-full object-cover" />`;

  // Layer 3 - Front
  const layer3 = document.createElement("div");
  layer3.className = "fixed inset-0 z-[3] origin-center";
  layer3.innerHTML = `
    <img src="images/bgz2.png" alt="" class="absolute inset-0 w-full h-full object-cover" />
    <div class="absolute inset-0 bg-dark-900/80"></div>
  `;

  // Insert layers at the beginning of body in correct order (back to front)
  body.insertBefore(layer3, body.firstChild); // front layer (highest z-index)
  body.insertBefore(layer2, body.firstChild); // middle layer
  body.insertBefore(layer1, body.firstChild); // back layer (lowest z-index)

  return [layer1, layer2, layer3];
}

// Different movement strengths for each layer (back to front)
const movementFactors = [5, 20, 55]; // pixels max offset
// Different scales for each layer to enhance parallax effect
const scales = [1.05, 1.1, 1.15]; // scale factors

// Initialize parallax when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Create layers and get references
  const layers = createParallaxLayers();

  // Set up mouse movement listener
  window.addEventListener("mousemove", (e) => {
    // Calculate offset relative to center (range -1 to 1)
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = (e.clientY / window.innerHeight) * 2 - 1;

    layers.forEach((layer, index) => {
      if (!layer) return; // skip if layer not found
      const movement = movementFactors[index];
      const scale = scales[index];
      // Move opposite to cursor movement for subtle parallax
      const translateX = -x * movement;
      const translateY = -y * movement;
      layer.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
    });
  });
});
