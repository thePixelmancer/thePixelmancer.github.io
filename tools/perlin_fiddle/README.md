# BlockCraft Studio

A specialized web-based tool for creating and visualizing procedural generation patterns with custom JavaScript code. Built around p5.js, this app handles all the canvas boilerplate, panning, zooming, and tedious setup so you can focus purely on how math can generate pixels based on coordinates.

## Why This Exists

**1. Removes Technical Friction**: This app wraps p5.js and handles all the tedious setup - canvas creation, coordinate systems, pixel manipulation, panning, zooming - so you can jump straight into mathematical creativity.

**2. Minecraft Development Aid**: Designed specifically to help visualize how procedural generation would look in Minecraft. The syntax mirrors Molang (Minecraft's expression language) closely, allowing rapid prototyping of terrain generation, biome patterns, and world features.

**3. Molang Limitations Sandbox**: Provides a constrained environment similar to Minecraft's Molang system. While using JavaScript syntax, the patterns and approaches translate directly to Molang with minor syntax changes, helping developers work within Minecraft's mathematical constraints.

**4. Instant Visual Feedback**: See how mathematical expressions translate to visual patterns immediately - perfect for understanding noise functions, procedural generation, and algorithmic art concepts.

## Features

- **Custom JavaScript Code Editor**: Write procedural generation algorithms with syntax highlighting and CodeMirror
- **Real-time Visualization**: See your changes instantly on a 512x512 canvas
- **World Coordinate System**: Work with world coordinates (like Minecraft chunks) rather than screen pixels
- **Interactive Controls**: Mouse wheel zoom, drag to pan, adjustable world size and grid overlay
- **Flexible Output**: Support for grayscale values, RGB colors, and alpha transparency
- **Built-in Functions**: Noise, math functions, and custom helpers like `loop()`, `random_integer()`, `hermite_blend()`
- **Persistent Storage**: Your code automatically saves and restores between sessions
- **Grid Overlay**: Visual grid system to help understand coordinate spaces and chunk boundaries

## Getting Started

1. Open `index.html` in your web browser
2. The canvas will display the default noise pattern
3. Modify the JavaScript code in the editor panel
4. Press **Ctrl+Enter** or click "Apply Code" to see your changes
5. Use mouse wheel to zoom, drag to pan around the generated world
6. Adjust "World Size" to change the area covered (higher = more world visible)
7. Adjust "Grid Size" and color to visualize coordinate boundaries

## Controls

- **Mouse Wheel**: Zoom in/out of the generated world
- **Click and Drag**: Pan around the world
- **Ctrl+Enter**: Apply your custom code changes
- **World Size Input**: Control how much of the world is visible (128-4096)
- **Grid Size Input**: Spacing of overlay grid lines
- **Grid Color**: Color of the overlay grid

## Code Structure

Your custom JavaScript code should set a `result` variable that determines the pixel color:

### Available Variables
- `x`, `y`: Current world coordinates (not screen pixels)

### Available Functions
- `noise(x, y)`: Perlin noise function
- All standard Math functions: `sin()`, `cos()`, `abs()`, `sqrt()`, `pow()`, `floor()`, `ceil()`, etc.
- `PI`, `E` constants
- `loop(count, function)`: Custom loop function
- `random()`: Random number 0-1
- `random_integer(max)`: Random integer 0 to max-1
- `hermite_blend(t)`: Smooth interpolation function

### Variable Storage
- `variable`: Object for storing custom variables (e.g., `variable.height = 0.5`)
- `v`: Short alias for `variable` (e.g., `v.biome = "forest"`)
- Both `variable` and `v` reference the same object, so mutations affect both

### Return Values

**Grayscale (0-1 range):**
```javascript
let n = noise(x * 0.03, y * 0.03);
result = n; // Grayscale value between 0 and 1
```

**Boolean (black/white):**
```javascript
let n = noise(x * 0.1, y * 0.1);
result = n > 0.7; // true = white, false = black
```

**RGB Color:**
```javascript
let n1 = noise(x * 0.02, y * 0.02);
let n2 = noise(x * 0.05, y * 0.05);
result = {
    r: n1,        // Red channel (0-1)
    g: n2,        // Green channel (0-1)
    b: 0.5        // Blue channel (0-1)
};
```

**RGB with Alpha:**
```javascript
result = {
    r: 1.0,       // Red (0-1)
    g: 0.5,       // Green (0-1)
    b: 0.0,       // Blue (0-1)
    a: 128        // Alpha (0-255)
};
```

## World Size System

The tool uses a world coordinate system where you can adjust how much of the procedural world is visible:

- **World Size 128**: Shows a 128×128 area (zoomed in view)
- **World Size 256**: Default view showing 256×256 area  
- **World Size 512**: Shows 512×512 area (zoomed out view)
- **World Size 1024**: Very wide view showing 1024×1024 area

This system mimics how Minecraft handles world coordinates - higher world sizes show more terrain, like flying higher above the world.

## Example Patterns

### Basic Perlin Noise
```javascript
result = noise(x * 0.03, y * 0.03);
```

### Minecraft-Style Terrain
```javascript
let height = noise(x * 0.01, y * 0.01);
if (height < 0.3) {
    result = {r: 0.1, g: 0.3, b: 0.8}; // Water (blue)
} else if (height < 0.6) {
    result = {r: 0.2, g: 0.7, b: 0.2}; // Grass (green)
} else {
    result = {r: 0.8, g: 0.8, b: 0.9}; // Mountains (white)
}
```

### Chunk-Based Generation
```javascript
let chunkX = floor(x / 64);
let chunkY = floor(y / 64);
let chunkNoise = noise(chunkX * 0.1, chunkY * 0.1);
result = chunkNoise > 0.5;
```

### Using Variables for Complex Logic
```javascript
// Store intermediate calculations
v.height = noise(x * 0.01, y * 0.01);
v.temperature = noise(x * 0.02 + 1000, y * 0.02 + 1000);
v.humidity = noise(x * 0.015 + 2000, y * 0.015 + 2000);

// Determine biome based on stored variables
if (v.height > 0.7) {
    result = {r: 0.9, g: 0.9, b: 1.0}; // Snow peaks
} else if (v.temperature > 0.6 && v.humidity < 0.3) {
    result = {r: 0.9, g: 0.8, b: 0.5}; // Desert
} else if (v.humidity > 0.7) {
    result = {r: 0.1, g: 0.4, b: 0.1}; // Swamp
} else {
    result = {r: 0.2, g: 0.7, b: 0.2}; // Grassland
}
```

### Rivers Using Inverse Noise
```javascript
let terrain = noise(x * 0.008, y * 0.008);
let riverNoise = 1 - terrain; // Invert for valleys
let isRiver = riverNoise > 0.7 && terrain < 0.4;
result = isRiver ? {r: 0.2, g: 0.4, b: 0.8} : {r: 0.3, g: 0.6, b: 0.2};
```

### Layered Noise (Octaves)
```javascript
let noise1 = noise(x * 0.01, y * 0.01);
let noise2 = noise(x * 0.03, y * 0.03) * 0.5;
let noise3 = noise(x * 0.08, y * 0.08) * 0.25;
result = noise1 + noise2 + noise3;
```

## Minecraft/Molang Connection

This tool is designed to bridge the gap between JavaScript experimentation and Minecraft's Molang expression system:

**JavaScript (this tool)**:
```javascript
let height = noise(x * 0.01, y * 0.01);
result = height > 0.5;
```

**Equivalent Molang**:
```molang
variable.height = math.noise(query.position.x * 0.01, query.position.z * 0.01);
return variable.height > 0.5;
```

The syntax is nearly identical, allowing you to prototype Minecraft world generation features here and translate them to working Molang with minimal changes. This helps work within Molang's mathematical constraints while maintaining the visual feedback needed for complex procedural generation.

## Technical Details

- Built with p5.js for canvas rendering and mathematical functions
- Uses CodeMirror for syntax-highlighted code editing with JavaScript mode
- Implements world coordinate system for intuitive terrain-scale thinking
- Custom function compilation for safe user code execution
- Persistent localStorage for code and settings between sessions
- Optimized pixel manipulation for smooth real-time rendering

## Use Cases

- **Minecraft Development**: Prototype biome generation, terrain features, and world patterns
- **Game Development**: Generate terrain heightmaps, texture patterns, and procedural worlds  
- **Molang Prototyping**: Test mathematical expressions before implementing in Minecraft
- **Learning**: Understand noise functions, procedural generation, and coordinate systems
- **Digital Art**: Create abstract patterns, textures, and algorithmic art
- **Education**: Teach mathematical visualization and procedural concepts

## Browser Compatibility

Works in all modern browsers that support:
- HTML5 Canvas
- ES6 JavaScript features
- p5.js library

## License

Open source - feel free to modify and distribute.