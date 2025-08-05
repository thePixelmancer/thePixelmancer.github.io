# p5.js Noise Visualizer

A powerful web-based tool for creating and visualizing Perlin noise patterns with custom JavaScript code. Perfect for procedural generation, pixel art creation, and experimenting with noise-based algorithms.

## Features

- **Custom JavaScript Code Editor**: Write your own noise generation algorithms with syntax highlighting
- **Real-time Visualization**: See your changes instantly on a 600x600 canvas
- **Variable Resolution**: Switch between full resolution and pixel art modes (1x1 to 600x600 pixels)
- **Interactive Controls**: Adjust frequency with mouse wheel, change resolution with keyboard
- **Flexible Output**: Support for grayscale values, RGB colors, and alpha transparency
- **Built-in Math Functions**: Access to all common mathematical functions

## Getting Started

1. Open `index.html` in your web browser
2. The canvas will display the default noise pattern
3. Modify the JavaScript code in the editor panel
4. Press **Ctrl+Enter** or click "Apply Code" to see your changes

## Controls

- **Mouse Wheel**: Scroll on canvas to adjust frequency (zoom in/out of noise pattern)
- **R Key**: Cycle through different resolution settings for pixel art effects
- **Ctrl+Enter**: Apply your custom code changes

## Code Structure

Your custom JavaScript code should set a `result` variable that determines the pixel color:

### Available Variables
- `x`, `y`: Current pixel coordinates
- `frequency`: Current frequency setting (adjustable with mouse wheel)

### Available Functions
- `noise(x, y)`: Perlin noise function
- All standard Math functions: `sin()`, `cos()`, `abs()`, `sqrt()`, `pow()`, etc.
- `PI`, `E` constants

### Return Values

**Grayscale (0-1 range):**
```javascript
let n = noise(x * frequency, y * frequency);
result = n; // Grayscale value between 0 and 1
```

**Boolean (black/white):**
```javascript
let n = noise(x * frequency * 0.1, y * frequency * 0.1);
result = n > 0.7; // true = white, false = black
```

**RGB Color:**
```javascript
let n1 = noise(x * frequency, y * frequency);
let n2 = noise(x * frequency * 2, y * frequency * 2);
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

## Resolution Modes

The tool supports various resolution modes for different use cases:

- **Resolution 1**: Full detail (600x600 pixels) - for smooth gradients
- **Resolution 10**: 10x10 grid - for medium pixel art
- **Resolution 100**: 100x100 grid - for detailed pixel art
- **Resolution 600**: Single pixel - for color testing

Press **R** to cycle through: 1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 25, 30, 40, 50, 60, 75, 100, 120, 150, 200, 300, 600

## Example Patterns

### Basic Perlin Noise
```javascript
result = noise(x * frequency, y * frequency);
```

### Layered Noise (Octaves)
```javascript
let noise1 = noise(x * frequency, y * frequency);
let noise2 = noise(x * frequency * 2, y * frequency * 2);
let noise3 = noise(x * frequency * 4, y * frequency * 4);
result = (noise1 + noise2 * 0.5 + noise3 * 0.25) / 1.75;
```

### Threshold Pattern (Islands)
```javascript
let n = noise(x * frequency * 0.1, y * frequency * 0.1);
result = n > 0.7;
```

### Colorful Terrain
```javascript
let height = noise(x * frequency, y * frequency);
if (height < 0.3) {
    result = {r: 0.1, g: 0.3, b: 0.8}; // Water (blue)
} else if (height < 0.6) {
    result = {r: 0.2, g: 0.7, b: 0.2}; // Grass (green)
} else {
    result = {r: 0.6, g: 0.4, b: 0.2}; // Mountain (brown)
}
```

### Animated Pattern
```javascript
let time = Date.now() * 0.001;
let n = noise(x * frequency + time, y * frequency);
result = {
    r: (sin(n * PI * 2) + 1) * 0.5,
    g: (cos(n * PI * 2) + 1) * 0.5,
    b: n
};
```

## Technical Details

- Built with p5.js for canvas rendering
- Uses CodeMirror for syntax-highlighted code editing
- Supports pixel manipulation for high-performance rendering
- Custom function compilation for user code execution

## Use Cases

- **Game Development**: Generate terrain, textures, or world maps
- **Digital Art**: Create abstract patterns and textures
- **Pixel Art**: Design retro-style sprites and backgrounds
- **Learning**: Understand noise functions and procedural generation
- **Prototyping**: Quick experimentation with algorithmic art

## Browser Compatibility

Works in all modern browsers that support:
- HTML5 Canvas
- ES6 JavaScript features
- p5.js library

## License

Open source - feel free to modify and distribute.