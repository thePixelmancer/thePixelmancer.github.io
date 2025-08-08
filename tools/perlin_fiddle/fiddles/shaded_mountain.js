v.seed = 22254;
v.perlin_freq = 0.003;

// Base noise combined from two octaves
v.perlin_1 = q.noise(v.originx * v.perlin_freq + v.seed, v.originz * v.perlin_freq);
v.perlin_2 = q.noise(v.originx * v.perlin_freq * 2 + v.seed, v.originz * v.perlin_freq * 2) * 0.5;
v.total_perlin = (v.perlin_1 + v.perlin_2) / 1.5;

// Neighbor noise for gradient calculation (offset by 2 units)
v.xperlin_1 = q.noise((v.originx + 2) * v.perlin_freq + v.seed, v.originz * v.perlin_freq);
v.xperlin_2 = q.noise((v.originx + 2) * v.perlin_freq * 2 + v.seed, v.originz * v.perlin_freq * 2) * 0.5;
v.xtotal_perlin = (v.xperlin_1 + v.xperlin_2) / 1.5;

v.zperlin_1 = q.noise(v.originx * v.perlin_freq + v.seed, (v.originz + 2) * v.perlin_freq);
v.zperlin_2 = q.noise(v.originx * v.perlin_freq * 2 + v.seed, (v.originz + 2) * v.perlin_freq * 2) * 0.5;
v.ztotal_perlin = (v.zperlin_1 + v.zperlin_2) / 1.5;

// Calculate gradient (scale up slope for better contrast)
v.slope_scale = 60;
v.delta_x = ((v.xtotal_perlin - v.total_perlin) / 2) * v.slope_scale;
v.delta_z = ((v.ztotal_perlin - v.total_perlin) / 2) * v.slope_scale;

// Calculate normal length for lighting
v.slope = math.sqrt(v.delta_x * v.delta_x + v.delta_z * v.delta_z + 1);

// Calculate dot product with light direction (-1, -1, 1 normalized)
v.dot = (-v.delta_x * -1 + -v.delta_z * -1 + 1 * 1) / (v.slope * math.sqrt(3));

// Clamp shade between 0 and 1 and smoothstep for better contrast
v.shade = math.max(0, math.min(1, v.dot));
v.shade = math.hermite_blend(v.shade);

// Normalize height to [0..1]
v.height = v.total_perlin * 0.5 + 0.5;

// Sea level and snow flags
v.seaLevel = 0.35;
v.isSnow = v.height >= 0.63 || v.slope < 1.001;

// Define simple discrete colors for levels (no interpolation)
v.color = 
  v.height < v.seaLevel
    ? { r: 0.0, g: 0.3, b: 0.6 } // sea blue
  : v.isSnow
    ? { r: 1.0, g: 1.0, b: 1.0 } // snow white
  : v.height < 0.5
    ? { r: 0.2, g: 0.5, b: 0.2 } // green grass
  : v.height < 0.7
    ? { r: 0.5, g: 0.5, b: 0.5 } // gray rocks
  : { r: 0.2, g: 0.2, b: 0.2 };  // dark rocks/cliffs

// Apply shading but leave sea and snow bright
v.color.r *= v.height < v.seaLevel ? math.random(1,1.1) : v.shade / v.height * 0.7;
v.color.g *= v.height < v.seaLevel ?  math.random(1,1.1) : v.shade / v.height * 0.7;
v.color.b *= v.height < v.seaLevel ?  math.random(1,1.1) : v.shade / v.height * 0.7;


return v.color;
