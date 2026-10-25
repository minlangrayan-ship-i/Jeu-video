import * as THREE from "three";
import { PLACES } from "./content.js";

// All surfaces are authored locally. No external image or texture service is used.
function surface(kind, colour) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const c = canvas.getContext("2d");
  c.fillStyle = colour;
  c.fillRect(0, 0, 256, 256);
  let seed = 19;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  if (kind === "brick") {
    c.fillStyle = "#d1bba2";
    c.fillRect(0, 0, 256, 256);
    for (let row = 0; row < 16; row++)
      for (let col = -1; col < 5; col++) {
        c.fillStyle = `hsl(${12 + random() * 9}, ${29 + random() * 12}%, ${42 + random() * 15}%)`;
        c.fillRect(col * 64 + (row % 2) * 32 + 2, row * 16 + 1, 60, 13);
      }
  } else if (kind === "paving") {
    c.fillStyle = "#b2afa0";
    c.fillRect(0, 0, 256, 256);
    for (let row = 0; row < 8; row++)
      for (let col = -1; col < 5; col++) {
        const light = 68 + random() * 12;
        c.fillStyle = `hsl(39, 13%, ${light}%)`;
        c.fillRect(col * 64 + (row % 2) * 32 + 1, row * 32 + 1, 62, 30);
      }
  } else if (kind === "slate") {
    for (let row = 0; row < 12; row++)
      for (let col = -1; col < 9; col++) {
        c.fillStyle = `rgba(255,255,255,${random() * 0.12})`;
        c.fillRect(col * 32 + (row % 2) * 16, row * 22, 30, 20);
        c.strokeStyle = "#172d352b";
        c.strokeRect(col * 32 + (row % 2) * 16, row * 22, 31, 21);
      }
  } else {
    for (let i = 0; i < 5500; i++) {
      c.fillStyle = random() > 0.5 ? "#ffffff0c" : "#152b2310";
      c.fillRect(random() * 256, random() * 256, 1 + random(), 1 + random());
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(kind === "paving" ? 3 : 2, kind === "paving" ? 3 : 2);
  texture.anisotropy = 4;
  return new THREE.MeshStandardMaterial({
    map: texture,
    roughness: kind === "slate" ? 0.75 : 0.94,
  });
}

export function buildHarbour(w) {
  const scene = w.scene;
  w.occluders = [];
  w.windows = [];
  w.birds = [];
  const cream = "#f3dfbc",
    dark = "#254f52",
    oak = "#947154";
  const brick = surface("brick", "#a66952");
  const paving = surface("paving", "#c7baa1");
  const slate = surface("slate", "#3d555e");
  const terracotta = surface("slate", "#b56e54");
  const road = surface("grain", "#536c70");
  road.map.repeat.set(12, 2);
  const grass = surface("grain", "#87a567");
  grass.map.repeat.set(18, 18);
  const box = (...args) => w.box(...args);

  // A continuous coastline replaces the floating board of the original scene.
  box(82, 2.4, 92, "#ae9676", 18, -1.35, -14);
  box(82, 0.12, 92, grass, 18, -0.1, -14);
  const seaGeometry = new THREE.PlaneGeometry(360, 360, 48, 48);
  seaGeometry.rotateX(-Math.PI / 2);
  w.sea = new THREE.Mesh(
    seaGeometry,
    new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        tint: { value: new THREE.Color("#4d9fa8") },
      },
      vertexShader: `uniform float time; varying vec3 vWorld; void main(){vec3 p=position;p.y+=sin(p.x*.34+time*.5)*.08+cos(p.z*.27+time*.4)*.06;vWorld=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
      fragmentShader: `uniform float time;uniform vec3 tint;varying vec3 vWorld;void main(){float wave=sin(vWorld.x*1.9+sin(vWorld.z*.5)+time*.7)*cos(vWorld.z*1.3+time*.3);float glint=smoothstep(.88,1.,wave);vec3 col=tint+vec3(.035)*wave+vec3(.20,.22,.19)*glint;gl_FragColor=vec4(col,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`,
    }),
  );
  w.sea.position.y = -1.2;
  scene.add(w.sea);

  box(46, 0.2, 8.5, paving, 0, 0.02, 0);
  box(8.5, 0.2, 43, paving, 0, 0.025, 0);
  box(46, 0.05, 5.1, road, 0, 0.15, 0);
  box(5.1, 0.05, 43, road, 0, 0.155, 0);
  for (let x = -21; x <= 21; x += 4)
    if (Math.abs(x) > 5) box(1.7, 0.015, 0.09, "#e8d8ac", x, 0.19, 0);
  for (let z = -19; z <= 19; z += 4)
    if (Math.abs(z) > 5) box(0.09, 0.015, 1.7, "#e8d8ac", 0, 0.195, z);
  for (const z of [-2.8, 2.8]) box(46, 0.18, 0.22, "#c7beaa", 0, 0.1, z);
  for (const x of [-2.8, 2.8]) box(0.22, 0.18, 43, "#c7beaa", x, 0.1, 0);
  for (let i = 0; i < 6; i++)
    box(0.5, 0.012, 4.7, "#f0e8d5", -1.6 + i * 0.65, 0.2, 5);
  for (const id of ["home", "cafe", "market", "work", "books"]) building(id);

  function windowAt(g, x, y, z, wide = 1.25, tall = 1.4) {
    const glass = new THREE.MeshStandardMaterial({
      color: "#53848c",
      roughness: 0.25,
      metalness: 0.25,
      emissive: "#ffca83",
      emissiveIntensity: 0.06,
    });
    w.windows.push(glass);
    box(wide + 0.2, tall + 0.2, 0.18, cream, x, y, z, g);
    box(wide, tall, 0.12, glass, x, y, z + 0.12, g);
    box(wide + 0.06, 0.07, 0.13, cream, x, y, z + 0.2, g);
    box(0.065, tall, 0.13, cream, x, y, z + 0.2, g);
    box(wide + 0.4, 0.14, 0.5, "#efe3cd", x, y - tall / 2 - 0.1, z + 0.08, g);
    // Interior curtains and reflections, with no transparency sorting cost.
    box(0.17, tall * 0.9, 0.025, "#d9cab0", x - wide * 0.4, y, z + 0.21, g);
    box(
      0.07,
      tall * 0.35,
      0.025,
      "#aac8c3",
      x + wide * 0.28,
      y + 0.25,
      z + 0.22,
      g,
    );
  }

  function building(id) {
    const p = PLACES[id],
      g = new THREE.Group();
    g.position.set(p.x, 0.1, p.z);
    g.userData.occluder = id;
    scene.add(g);
    const width = id === "cafe" ? 7.7 : id === "work" ? 7.5 : 7;
    const depth = 5.4,
      height = id === "books" ? 4.7 : 5.4;
    const body =
      id === "cafe" || id === "books"
        ? brick
        : id === "home"
          ? "#e8cfaa"
          : id === "market"
            ? "#e4d9b9"
            : "#b5c3bd";
    box(width + 0.5, 0.35, depth + 0.5, "#a59983", 0, 0.1, 0, g);
    box(width, height, depth, body, 0, height / 2 + 0.25, 0, g);
    box(width + 0.15, 0.5, depth + 0.15, "#b09e83", 0, 0.48, 0, g);
    for (const x of [-width / 2 + 0.12, width / 2 - 0.12])
      box(0.22, height, depth + 0.12, "#e5d7bb", x, height / 2 + 0.25, 0, g);
    box(width + 0.65, 0.2, depth + 0.6, cream, 0, height + 0.35, 0, g);
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2 - 0.35, 0);
    shape.lineTo(0, 2.1);
    shape.lineTo(width / 2 + 0.35, 0);
    shape.closePath();
    const roof = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, {
        depth: depth + 0.7,
        bevelEnabled: false,
      }),
      id === "home" ? terracotta : slate,
    );
    roof.position.set(0, height + 0.45, -depth / 2 - 0.35);
    roof.castShadow = true;
    g.add(roof);
    box(0.8, 1.9, 0.8, brick, width / 2 - 1.2, height + 1.4, -1, g);
    box(1, 0.14, 1, "#e0c6a0", width / 2 - 1.2, height + 2.4, -1, g);
    w.cylinder(
      0.12,
      0.15,
      0.4,
      "#6c665c",
      width / 2 - 1.2,
      height + 2.6,
      -1,
      g,
    );
    for (const x of [-2.1, 2.1])
      windowAt(g, x, height - 1.15, depth / 2 + 0.05, 1.3, 1.45);
    if (id === "home") {
      windowAt(g, -2.1, 1.85, 2.9, 1.6, 1.7);
      windowAt(g, 2.1, 1.85, 2.9, 1.6, 1.7);
      box(2.0, 0.3, 0.7, "#7a8361", -2.1, 1, 3.13, g);
      for (let i = 0; i < 7; i++)
        flower(p.x - 2.8 + i * 0.22, p.z + 3.2, 1.34, "#dfbca3");
    } else {
      for (const x of [-2.2, 2.2]) windowAt(g, x, 1.65, 2.8, 1.7, 1.8);
    }
    box(1.35, 2.8, 0.18, cream, 0, 1.65, 2.78, g);
    box(1.08, 2.55, 0.16, id === "home" ? "#416b71" : dark, 0, 1.65, 2.9, g);
    box(0.79, 1.3, 0.05, "#6e9b9d", 0, 2, 3, g);
    box(0.9, 0.07, 0.06, cream, 0, 2.3, 3.05, g);
    w.sphere(0.065, "#e3b85e", 0.4, 1.3, 3.07, g);
    box(1.7, 0.2, 1.1, "#c9bca2", 0, 0.25, 3.15, g);
    const sign = w.label(
      p.name,
      width - 0.6,
      0.72,
      id === "cafe" ? "#1e4749" : id === "books" ? "#843f3d" : "#eadabd",
      id === "cafe" || id === "books" ? "#ffedc8" : dark,
    );
    sign.position.set(0, 3.05, 2.9);
    g.add(sign);
    if (id === "cafe" || id === "market" || id === "books") {
      const stripe =
        id === "market" ? "#528575" : id === "cafe" ? "#c67850" : "#923f44";
      for (let i = 0; i < 12; i++) {
        const awning = box(
          (width + 0.25) / 12,
          0.12,
          1.5,
          i % 2 ? cream : stripe,
          -width / 2 + ((i + 0.5) * width) / 12,
          2.7,
          3.25,
          g,
        );
        awning.rotation.x = 0.14;
        box(
          (width + 0.25) / 12,
          0.27,
          0.1,
          i % 2 ? cream : stripe,
          -width / 2 + ((i + 0.5) * width) / 12,
          2.48,
          4,
          g,
        );
      }
    }
    // Side windows and gutters make the rotating camera useful on every side.
    for (const side of [-1, 1]) {
      for (const z of [-1.2, 1.2]) {
        const frame = box(
          0.15,
          1.65,
          1.3,
          cream,
          side * (width / 2 + 0.03),
          height - 1.3,
          z,
          g,
        );
        box(
          0.17,
          1.4,
          1.08,
          "#59828b",
          frame.position.x + side * 0.04,
          height - 1.3,
          z,
          g,
        );
      }
      box(
        0.1,
        height,
        0.1,
        "#5d6a60",
        side * (width / 2 + 0.18),
        height / 2,
        2.6,
        g,
      );
    }
    box(2.1, 0.08, 3.5, paving, p.x, 0.1, p.z + 5.1);
    for (const x of [-width / 2 - 0.2, width / 2 + 0.2])
      pot(p.x + x, p.z + 3.2);
    if (id === "market")
      for (const dx of [-2.4, 2.4]) {
        box(1.7, 0.75, 1.1, oak, p.x + dx, 0.5, p.z + 3.7);
        for (let n = 0; n < 10; n++)
          w.sphere(
            0.17,
            dx < 0 ? "#d77b48" : "#9cbd51",
            p.x + dx - 0.6 + (n % 5) * 0.3,
            0.99,
            p.z + 3.45 + Math.floor(n / 5) * 0.4,
            scene,
            1,
          );
      }
    if (id === "books") {
      const board = box(0.9, 1.3, 0.1, "#335d55", p.x + 2.6, 0.8, p.z + 4.8);
      board.rotation.x = -0.14;
      const sign = w.label(
        "OPEN · BOOKS & STORIES",
        0.79,
        0.48,
        "#335d55",
        "#f1e1b9",
      );
      sign.position.set(p.x + 2.6, 0.95, p.z + 4.92);
      scene.add(sign);
    }
    w.obstacles.push({
      x: p.x,
      z: p.z,
      w: width / 2 + 0.35,
      d: depth / 2 + 0.35,
    });
    w.occluders.push({
      id,
      box: new THREE.Box3(
        new THREE.Vector3(p.x - width / 2 - 0.4, 0, p.z - depth / 2 - 0.4),
        new THREE.Vector3(
          p.x + width / 2 + 0.4,
          height + 3,
          p.z + depth / 2 + 1.4,
        ),
      ),
      materials: [],
      opacity: 1,
    });
  }

  function flower(x, z, y = 0.35, colour = "#e9bb8c") {
    w.cylinder(0.025, 0.025, 0.3, "#4f7f4d", x, y, z);
    for (let j = 0; j < 4; j++)
      w.sphere(
        0.105,
        colour,
        x + Math.cos((j * Math.PI) / 2) * 0.1,
        y + 0.2,
        z + Math.sin((j * Math.PI) / 2) * 0.1,
        scene,
        0,
      );
    w.sphere(0.06, "#eac36d", x, y + 0.24, z, scene, 0);
  }
  function pot(x, z) {
    w.cylinder(0.38, 0.27, 0.65, "#b47151", x, 0.38, z);
    w.cylinder(0.42, 0.42, 0.1, "#c78b62", x, 0.73, z);
    w.sphere(0.4, "#58894c", x, 1, z);
    for (let i = 0; i < 4; i++)
      flower(
        x + Math.cos(i * 2) * 0.2,
        z + Math.sin(i * 2) * 0.2,
        1.1,
        i % 2 ? "#e9bd78" : "#d49b9e",
      );
  }
  function tree(x, z, scale = 1) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.scale.setScalar(scale);
    g.userData.occluder = `tree-${x}-${z}`;
    scene.add(g);
    w.occluders.push({
      id: g.userData.occluder,
      box: new THREE.Box3(
        new THREE.Vector3(x - 1.9 * scale, 1.8 * scale, z - 1.9 * scale),
        new THREE.Vector3(x + 1.9 * scale, 5.4 * scale, z + 1.9 * scale),
      ),
      materials: [],
      opacity: 1,
    });
    w.obstacles.push({ x, z, w: 0.32 * scale, d: 0.32 * scale });
    w.cylinder(0.12, 0.26, 3.8, "#78604b", 0, 1.9, 0, g);
    const branch = w.cylinder(0.07, 0.12, 1.7, "#78604b", 0.35, 2.7, 0, g);
    branch.rotation.z = -0.5;
    const colours = ["#4d7d55", "#628d57", "#86a663", "#729654"];
    for (let i = 0; i < 12; i++) {
      const angle = i * 2.4,
        radius = i < 4 ? 0.65 : 1.15;
      const leaf = w.sphere(
        0.88,
        colours[i % 4],
        Math.cos(angle) * radius,
        3.7 + Math.sin(i * 1.7) * 0.6 + (i < 4 ? 0.55 : 0),
        Math.sin(angle) * radius,
        g,
        1,
      );
      leaf.scale.y = 0.85;
    }
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.6, 20),
      new THREE.MeshBasicMaterial({
        color: "#365533",
        transparent: true,
        opacity: 0.09,
        depthWrite: false,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.05;
    g.add(shadow);
  }
  const treePositions = [
    [-18, 15, 1.05],
    [-19, -16, 1.25],
    [-18, -6, 0.85],
    [-6, 8, 0.85],
    [-7, 18, 1],
    [5, 18, 1],
    [19, 16, 1.2],
    [17, 5, 0.9],
    [8, 14, 0.8],
    [19, -15, 1.1],
    [7, -18, 0.9],
    [-6, -19, 0.95],
    [25, -5, 1.3],
    [27, 10, 1.2],
    [29, -20, 1.1],
  ];
  treePositions.forEach((p) => tree(...p));
  // Small park: curved paths, flower borders, picnic tables and a pond.
  box(13, 0.06, 12, "#87a767", 12, 0.03, 10);
  box(2.1, 0.07, 11, paving, 12, 0.1, 9);
  const pond = w.cylinder(2.3, 2.5, 0.15, "#bcb293", 16, 0.13, 11);
  pond.scale.z = 0.76;
  const water = w.cylinder(2.05, 2.05, 0.16, "#72a8a3", 16, 0.18, 11);
  water.scale.z = 0.76;
  for (const [x, z] of [
    [15, 7],
    [8.5, 11],
    [-16, -4.1],
    [5, -5.2],
  ])
    w.bench(x, z, x > 0 ? -0.3 : 0.1);
  for (let i = 0; i < 22; i++)
    flower(
      7.5 + (i % 7) * 0.37,
      15.8 + Math.floor(i / 7) * 0.36,
      0.35,
      ["#e4b58e", "#e8c971", "#c69eaa"][i % 3],
    );
  const parkSign = w.label("MEADOW PARK", 3.2, 0.65, "#335d4c", "#f4dfb9");
  parkSign.position.set(12, 2.25, 5.5);
  scene.add(parkSign);
  box(0.12, 2.2, 0.12, oak, 10.7, 1.1, 5.5);
  box(0.12, 2.2, 0.12, oak, 13.3, 1.1, 5.5);
  // Café terrace: circular tables, chairs, cups, and an umbrella.
  for (const [x, z] of [
    [-16.4, -4.2],
    [-7, -4.3],
  ]) {
    w.cylinder(0.72, 0.72, 0.12, "#c9aa78", x, 1.05, z);
    w.cylinder(0.07, 0.12, 1, dark, x, 0.5, z);
    w.cylinder(0.12, 0.1, 0.2, "#eee1c3", x, 1.22, z);
    w.cylinder(0.08, 0.08, 0.015, "#67402c", x, 1.33, z);
    for (const dx of [-1.1, 1.1]) {
      box(0.55, 0.12, 0.55, oak, x + dx, 0.58, z);
      box(0.55, 0.65, 0.08, oak, x + dx, 0.92, z - 0.28);
      for (const a of [-0.2, 0.2])
        box(0.06, 0.6, 0.06, dark, x + dx + a, 0.3, z + 0.18);
    }
  }
  w.cylinder(0.04, 0.06, 3.5, oak, -16.4, 1.8, -4.2);
  const umbrella = w.cylinder(0.08, 1.65, 0.65, "#c07550", -16.4, 3.5, -4.2);
  umbrella.geometry.rotateY(Math.PI / 8);
  [
    [-5, -4],
    [5, 4],
    [-5, 5],
    [5, -5],
    [-20, 1],
    [20, -1],
    [-18, 17],
  ].forEach(([x, z]) => w.lamp(x, z));
  // Harbour promenade and moored boats.
  box(3, 0.4, 48, "#a39175", -23, 0.05, -3);
  for (let i = 0; i < 50; i++)
    box(2.95, 0.025, 0.05, "#867860", -23, 0.27, -26 + i * 0.95);
  for (let i = 0; i < 16; i++) {
    w.cylinder(0.08, 0.1, 1.1, dark, -24.35, 0.8, -24 + i * 3);
    if (i < 15) box(0.06, 0.05, 3, "#7b8b80", -24.35, 1.17, -22.5 + i * 3);
  }
  for (const [x, z, colour] of [
    [-28, 7, "#a64639"],
    [-30, -3, "#f0d5a1"],
  ]) {
    const hull = w.sphere(1, colour, x, -0.8, z, scene, 1);
    hull.scale.set(1.1, 0.55, 2.7);
    box(1.55, 0.55, 1.7, "#ece3ce", x, -0.35, z);
    box(1.2, 0.7, 1.2, "#6d9b9d", x, 0.16, z);
    w.cylinder(0.04, 0.04, 4, oak, x, 1.1, z);
    box(1.8, 0.08, 1.8, cream, x, 0.58, z);
  }
  // Distant architecture and hills establish a real horizon when orbiting.
  for (let i = 0; i < 8; i++) {
    const x = -16 + i * 7,
      z = -26 - (i % 2) * 3,
      h = 4 + (i % 3);
    box(4.5, h, 5, ["#c2ba9e", "#b29e87", "#bbc2b5"][i % 3], x, h / 2, z);
    box(5, 0.5, 5.5, "#607372", x, h + 0.25, z);
  }
  for (let i = 0; i < 7; i++) {
    const hill = w.sphere(
      1,
      ["#8da99b", "#a4b5a0", "#6f938c"][i % 3],
      -50 + i * 18,
      -2,
      -56 - (i % 2) * 7,
      scene,
      2,
    );
    hill.scale.set(18, 8 + (i % 3) * 2, 13);
  }
  w.cylinder(0.9, 1.35, 7, "#ede5d1", -27, 2.3, -20);
  w.cylinder(0.98, 1, 0.7, "#ac5f4c", -27, 4.1, -20);
  w.cylinder(0.8, 0.8, 1.1, "#b9d5d1", -27, 6.1, -20);
  w.cylinder(0, 1.2, 0.9, "#ac5f4c", -27, 7.1, -20);
  for (let i = 0; i < 4; i++) {
    const bird = new THREE.Group();
    bird.position.set(-21 + i * 4, 10 + (i % 2) * 2, -4 - i * 5);
    for (const side of [-1, 1]) {
      const wing = box(0.7, 0.035, 0.18, "#f4efe2", side * 0.3, 0, 0, bird);
      wing.rotation.z = side * 0.25;
    }
    scene.add(bird);
    w.birds.push(bird);
  }
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(45, 43),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0.23;
  scene.add(ground);
  w.ground = ground;
}
