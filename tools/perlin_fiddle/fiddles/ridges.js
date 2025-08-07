v.scale = 0.01;

// Compute ridged noise = 1 - |noise|, then sharpen by raising to power 3
v.n1 = math.pow(1 - math.abs(q.noise(v.originx * v.scale, v.originz * v.scale)), 3);
v.n2 = math.pow(1 - math.abs(q.noise(v.originx * v.scale * 2, v.originz * v.scale * 2)), 3);
v.n3 = math.pow(1 - math.abs(q.noise(v.originx * v.scale * 4, v.originz * v.scale * 4)), 3);

// Map from [-1,1] to [0,1]
v.n1 = v.n1 / 2 + 0.5;
v.n2 = (v.n2 / 2 + 0.5) * 0.5;
v.n3 = (v.n3 / 2 + 0.5) * 0.25;

v.value = (v.n1 + v.n2 + v.n3) / (1 + 0.5 + 0.25);

return v.value;