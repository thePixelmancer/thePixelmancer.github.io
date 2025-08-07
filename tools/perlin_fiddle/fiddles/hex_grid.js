v.hex_size = 100;
v.hex_height = v.hex_size * 0.866;
v.hex_width = v.hex_size;

v.hx = math.floor(v.originx / v.hex_width);
v.hz = math.floor((v.originz - (v.hx % 2) * (v.hex_height / 2)) / v.hex_height);

v.cx = v.hx * v.hex_width + v.hex_width * 0.5;
v.cz = v.hz * v.hex_height + v.hex_height * 0.5 + (v.hx % 2) * (v.hex_height / 2);

v.dist = math.sqrt(math.pow(v.originx - v.cx, 2) + math.pow(v.originz - v.cz, 2));
v.normalized = 1 - math.clamp(v.dist / (v.hex_size * 0.5), 0, 1);

// Bright border, dark inside
return math.pow(1 - v.normalized, 3);