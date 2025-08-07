v.scale = 0.005;

// Terrain base octaves
v.oct1 = q.noise(v.originx * v.scale, v.originz * v.scale) / 2 + 0.5;
v.oct2 = (q.noise(v.originx * v.scale * 2, v.originz * v.scale * 2) / 2 + 0.5) * 0.5;
v.oct3 = (q.noise(v.originx * v.scale * 4, v.originz * v.scale * 4) / 2 + 0.5) * 0.25;
v.oct4 = (q.noise(v.originx * v.scale * 8, v.originz * v.scale * 8) / 2 + 0.5) * 0.125;
v.oct5 = (q.noise(v.originx * v.scale * 16, v.originz * v.scale * 16) / 2 + 0.5) * 0.0625;

v.elevation = (v.oct1 + v.oct2 + v.oct3 + v.oct4 + v.oct5) / (1 + 0.5 + 0.25 + 0.125 + 0.0625);
v.elevation = math.pow(v.elevation, 1.3);
v.elevation = math.clamp(v.elevation, 0, 1);

// River noise (higher frequency)
v.river_scale = 0.01;
v.river_noise = q.noise(v.originx * v.river_scale, v.originz * v.river_scale);

// Calculate distance to river centerline (river "valley")
v.river_dist = math.abs(v.river_noise);  // river_noise is from -1 to 1, close to 0 means river center
v.river_width = 0.02; // smaller = thinner rivers


// Carve river into elevation by subtracting based on distance to river centerline
v.river_effect = math.clamp((v.river_width - v.river_dist) / v.river_width, 0, 1) * 0.4; // max carve depth 0.4
v.elevation = math.clamp(v.elevation - v.river_effect, 0, 1);

// Color mapping with rivers in blue when carved low
return v.elevation < 0.35
  ? { r: 0, g: 0.2 + v.elevation * 0.5, b: 0.8 }
  : v.elevation < 0.55
  ? {
      r: 0.9 - (v.elevation - 0.35) * 2.5 * 0.3,
      g: 0.85 - (v.elevation - 0.35) * 2.5 * 0.25,
      b: 0.6 - (v.elevation - 0.35) * 2.5 * 0.2,
    }
  : v.elevation < 0.75
  ? {
      r: 0.4 + (v.elevation - 0.55) * 5 * 0.2,
      g: 0.7 + (v.elevation - 0.55) * 5 * 0.15,
      b: 0.3 - (v.elevation - 0.55) * 5 * 0.1,
    }
  : {
      r: 0.8 + (v.elevation - 0.75) * 4,
      g: 0.8 + (v.elevation - 0.75) * 4,
      b: 0.8 + (v.elevation - 0.75) * 4,
    };
