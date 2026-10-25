import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { PLACES } from "./content.js";
import { buildHarbour } from "./scenery.js";
import { loadResidents, spawnNeighbours } from "./residents.js";

const mat = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.87, ...extra });

export class HarbourWorld {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#b6d3dc");
    this.scene.fog = new THREE.Fog("#b6d3dc", 48, 115);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "low-power",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    this.camera = new THREE.PerspectiveCamera(44, 1, 0.1, 210);
    this.cameraYaw = 0.42;
    this.cameraPitch = 0.66;
    this.cameraDistance = innerWidth < 700 ? 15 : 18;
    this.cameraFocus = new THREE.Vector3();
    this.scene.add(new THREE.HemisphereLight("#c0dce9", "#6b7250", 1.65));
    this.sun = new THREE.DirectionalLight("#ffdbab", 2.8);
    this.sun.position.set(-20, 34, 18);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    Object.assign(this.sun.shadow.camera, {
      left: -34,
      right: 34,
      top: 34,
      bottom: -34,
      near: 1,
      far: 90,
    });
    this.sun.shadow.normalBias = 0.035;
    this.sun.shadow.radius = 2;
    this.scene.add(this.sun);
    this.materials = {};
    this.pickables = [];
    this.obstacles = [];
    this.clouds = [];
    this.keys = new Set();
    this.stick = { x: 0, z: 0 };
    this.path = [];
    this.clock = new THREE.Timer();
    this.clock.connect(document);
    this.elapsed = 0;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.buildTown();
    this.optimiseTown();
    this.player = new THREE.Group();
    const fallback = this.makePerson("#356d68", "#d87745", true);
    this.player.add(fallback);
    this.player.userData.fallback = fallback;
    this.player.userData.limbs = fallback.userData.limbs;
    this.player.traverse((o) => {
      o.castShadow = false;
    });
    this.player.position.set(-12, 0.1, 14);
    this.scene.add(this.player);
    this.cameraFocus
      .copy(this.player.position)
      .add(new THREE.Vector3(0, 1.35, 0));
    const tagCanvas = document.createElement("canvas");
    tagCanvas.width = 128;
    tagCanvas.height = 48;
    const tagContext = tagCanvas.getContext("2d");
    tagContext.fillStyle = "#244b3e";
    tagContext.beginPath();
    tagContext.roundRect(0, 0, 128, 48, 20);
    tagContext.fill();
    tagContext.fillStyle = "#fff3d4";
    tagContext.font = "600 25px sans-serif";
    tagContext.textAlign = "center";
    tagContext.fillText("YOU", 64, 33);
    const tagTexture = new THREE.CanvasTexture(tagCanvas);
    tagTexture.colorSpace = THREE.SRGBColorSpace;
    const tag = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: tagTexture,
        depthTest: false,
        depthWrite: false,
      }),
    );
    tag.position.y = 3.05;
    tag.scale.set(1.25, 0.47, 1);
    tag.renderOrder = 1000;
    this.player.add(tag);
    this.playerTag = tag;
    tag.visible = false;
    this.activityProp = new THREE.Group();
    this.player.add(this.activityProp);
    this.activityProp.visible = false;
    this.box(0.55, 0.12, 0.4, "#e1b86a", 0, 1.2, 0.6, this.activityProp);
    this.box(0.47, 0.05, 0.34, "#f8ebcf", 0, 1.29, 0.6, this.activityProp);
    this.marker = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.65, 0.06, 8, 40),
      mat("#ffb35d", { emissive: "#c27825", emissiveIntensity: 0.35 }),
    );
    ring.rotation.x = -Math.PI / 2;
    this.marker.add(ring);
    this.pin = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.33),
      mat("#ffc273"),
    );
    this.pin.position.y = 2.7;
    this.marker.add(this.pin);
    this.scene.add(this.marker);
    this.targetDisc = new THREE.Mesh(
      new THREE.RingGeometry(0.27, 0.37, 32),
      new THREE.MeshBasicMaterial({ color: "#ffefca", side: THREE.DoubleSide }),
    );
    this.targetDisc.rotation.x = -Math.PI / 2;
    this.targetDisc.visible = false;
    this.scene.add(this.targetDisc);
    this.createRain();
    this.createSky();
    spawnNeighbours(this);
    this.canvas.dataset.character = "loading";
    this.assetsReady = loadResidents(this).catch((error) => {
      console.error("Character assets could not be loaded:", error);
      this.canvas.dataset.character = "fallback";
      this.callbacks.onMessage?.(
        "Le personnage détaillé ne peut pas être chargé. Le jeu reste jouable avec le personnage de secours.",
      );
    });
    this.resize = this.resize.bind(this);
    this.onKeyDown = (e) => {
      if (
        /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) ||
        document.querySelector("dialog[open]")
      )
        return;
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
      )
        e.preventDefault();
      this.keys.add(e.key.toLowerCase());
    };
    this.onKeyUp = (e) => this.keys.delete(e.key.toLowerCase());
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", () => {
      this.keys.clear();
      this.stick = { x: 0, z: 0 };
    });
    window.addEventListener("resize", this.resize);
    let down,
      last,
      dragged = false;
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    canvas.addEventListener("pointerdown", (e) => {
      down = [e.clientX, e.clientY];
      last = down;
      dragged = false;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!down || this.paused) return;
      if (Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 8)
        dragged = true;
      if (dragged) {
        this.orbit(
          -(e.clientX - last[0]) * 0.006,
          (e.clientY - last[1]) * 0.004,
        );
        last = [e.clientX, e.clientY];
      }
    });
    canvas.addEventListener("pointerup", (e) => {
      if (down && !dragged && e.button !== 2) this.click(e);
      down = null;
    });
    canvas.addEventListener("pointercancel", () => {
      down = null;
    });
    canvas.addEventListener(
      "wheel",
      (e) => {
        if (!this.paused) {
          e.preventDefault();
          this.changeZoom(-Math.sign(e.deltaY) * 0.07);
        }
      },
      { passive: false },
    );
    this.resize();
    // Start after the constructor returns so callbacks can safely use the world.
    this.frame = requestAnimationFrame(() => this.animate());
  }

  material(color) {
    if (color?.isMaterial) return color;
    return (this.materials[color] ||= mat(color));
  }
  box(w, h, d, color, x, y, z, parent = this.scene) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      this.material(color),
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  sphere(radius, color, x, y, z, parent = this.scene, detail = 1) {
    const mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(radius, detail),
      this.material(color),
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }
  cylinder(r1, r2, h, color, x, y, z, parent = this.scene) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(r1, r2, h, 10),
      this.material(color),
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }
  label(text, w, h, background = "#f8efd9", color = "#284a40") {
    const canvas = document.createElement("canvas");
    canvas.width = 768;
    canvas.height = 160;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 768, 160);
    ctx.fillStyle = color;
    ctx.font = "600 64px Georgia";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 384, 83, 730);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: texture }),
    );
  }
  bench(x, z, angle = 0) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = angle;
    this.scene.add(g);
    for (const q of [-0.7, 0.7]) {
      this.box(0.12, 0.75, 0.8, "#405d53", q, 0.4, 0, g);
      this.box(0.12, 1.3, 0.12, "#405d53", q, 0.7, -0.4, g);
    }
    for (let i = 0; i < 3; i++)
      this.box(2.1, 0.12, 0.22, "#bc9870", 0, 0.8, -0.25 + i * 0.24, g);
    for (let i = 0; i < 2; i++)
      this.box(2.1, 0.19, 0.12, "#bc9870", 0, 1.15 + i * 0.25, -0.4, g);
  }
  lamp(x, z) {
    this.cylinder(0.07, 0.13, 3.9, "#466359", x, 1.95, z);
    this.box(0.48, 0.7, 0.48, "#f4ddb0", x, 4, z);
    this.box(0.67, 0.12, 0.67, "#466359", x, 4.4, z);
    this.cylinder(0.05, 0.15, 0.3, "#466359", x, 4.6, z);
  }
  buildTown() {
    buildHarbour(this);
  }
  makePerson(jacket = "#356d68", hair = "#d87745", player = false) {
    const g = new THREE.Group();
    const skin = "#e9b68c";
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.6, 24),
      new THREE.MeshBasicMaterial({
        color: "#3a5441",
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.05;
    g.add(shadow);
    const left = this.box(0.27, 0.73, 0.32, "#334d56", -0.2, 0.48, 0, g);
    const right = this.box(0.27, 0.73, 0.32, "#334d56", 0.2, 0.48, 0, g);
    this.box(0.3, 0.18, 0.47, "#eee3cc", -0.2, 0.15, 0.08, g);
    this.box(0.3, 0.18, 0.47, "#eee3cc", 0.2, 0.15, 0.08, g);
    this.cylinder(0.38, 0.43, 0.83, jacket, 0, 1.22, 0, g);
    const armL = this.box(0.22, 0.7, 0.26, jacket, -0.48, 1.2, 0, g);
    const armR = this.box(0.22, 0.7, 0.26, jacket, 0.48, 1.2, 0, g);
    this.sphere(0.14, skin, -0.48, 0.83, 0, g);
    this.sphere(0.14, skin, 0.48, 0.83, 0, g);
    this.sphere(0.42, skin, 0, 1.99, 0, g, 2);
    for (let i = 0; i < 7; i++)
      this.sphere(
        0.22,
        hair,
        Math.cos(i) * 0.25,
        2.2 + Math.sin(i) * 0.08,
        -0.05 + Math.sin(i) * 0.2,
        g,
      );
    this.sphere(0.035, "#353d32", -0.14, 1.99, 0.37, g);
    this.sphere(0.035, "#353d32", 0.14, 1.99, 0.37, g);
    this.sphere(0.065, skin, 0, 1.87, 0.41, g);
    if (player) {
      this.box(0.65, 0.57, 0.3, "#d69b54", 0, 1.22, -0.43, g);
      this.box(0.5, 0.26, 0.07, "#b88045", 0, 1.1, -0.62, g);
      this.box(0.43, 0.16, 0.5, "#f0c573", 0, 1.66, 0, g);
      this.box(0.15, 0.4, 0.1, "#f0c573", -0.16, 1.43, 0.37, g);
    }
    g.userData.limbs = [left, right, armL, armR];
    return g;
  }
  optimiseTown() {
    // Batch static geometry by material: a few dozen draw calls instead of
    // hundreds of individual windows, leaves and paving stones on mobile.
    this.scene.updateMatrixWorld(true);
    const batches = new Map(),
      originals = [];
    this.scene.traverse((object) => {
      if (
        !object.isMesh ||
        object === this.ground ||
        this.clouds.some((c) => c === object.parent) ||
        this.birds?.some((b) => b === object.parent)
      )
        return;
      const material = object.material;
      if (Array.isArray(material)) return;
      const geometry = object.geometry.index
        ? object.geometry.toNonIndexed()
        : object.geometry.clone();
      geometry.applyMatrix4(object.matrixWorld);
      let parent = object,
        domain = "";
      while (parent) {
        if (parent.userData.occluder) {
          domain = parent.userData.occluder;
          break;
        }
        parent = parent.parent;
      }
      const vertex =
        material.isMeshStandardMaterial &&
        !material.transparent &&
        !material.map &&
        !(material.emissive?.getHex() > 0 && material.emissiveIntensity > 0) &&
        material.metalness === 0;
      const key = domain + "|" + (vertex ? "vertex-colours" : material.uuid);
      if (vertex) {
        const colours = new Float32Array(
          geometry.attributes.position.count * 3,
        );
        for (let i = 0; i < colours.length; i += 3) {
          colours[i] = material.color.r;
          colours[i + 1] = material.color.g;
          colours[i + 2] = material.color.b;
        }
        geometry.setAttribute("color", new THREE.BufferAttribute(colours, 3));
      }
      let batch = batches.get(key);
      if (!batch) {
        const batchMaterial = vertex
          ? mat("#ffffff", { vertexColors: true })
          : domain
            ? material.clone()
            : material;
        batch = { material: batchMaterial, geometries: [], domain };
        batches.set(key, batch);
        if (this.windows?.includes(material)) {
          this.windowMaterials ||= [];
          this.windowMaterials.push(batchMaterial);
        }
      }
      batch.geometries.push(geometry);
      originals.push(object);
    });
    for (const { material, geometries, domain } of batches.values()) {
      const geometry = mergeGeometries(geometries);
      if (!geometry) continue;
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = !material.transparent;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      if (domain)
        this.occluders.find((o) => o.id === domain)?.materials.push(material);
      geometries.forEach((g) => g.dispose());
    }
    originals.forEach((object) => {
      object.removeFromParent();
      object.geometry.dispose();
    });
    this.pickables = [];
    for (const [id, p] of Object.entries(PLACES)) {
      const proxy = new THREE.Mesh(
        new THREE.BoxGeometry(
          id === "cafe" ? 8 : 7.6,
          id === "park" ? 2.5 : 8.5,
          5.8,
        ),
        new THREE.MeshBasicMaterial({ visible: false }),
      );
      proxy.position.set(p.x, id === "park" ? 1.25 : 3.5, p.z);
      proxy.userData.place = id;
      this.scene.add(proxy);
      this.pickables.push(proxy);
    }
  }
  createRain() {
    const positions = new Float32Array(600 * 3);
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = Math.random() * 50 - 25;
      positions[i + 1] = Math.random() * 25;
      positions[i + 2] = Math.random() * 50 - 25;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.rain = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: "#e3eee8",
        size: 0.1,
        transparent: true,
        opacity: 0.7,
      }),
    );
    this.rain.visible = false;
    this.scene.add(this.rain);
  }
  createSky() {
    this.sky = new THREE.Mesh(
      new THREE.SphereGeometry(155, 24, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          top: { value: new THREE.Color("#649db9") },
          bottom: { value: new THREE.Color("#eadbc2") },
        },
        vertexShader:
          "varying vec3 vPosition;void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
        fragmentShader:
          "uniform vec3 top;uniform vec3 bottom;varying vec3 vPosition;void main(){float h=clamp(normalize(vPosition+vec3(0.,20.,0.)).y,0.,1.);gl_FragColor=vec4(mix(bottom,top,pow(h,.65)),1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}",
      }),
    );
    this.scene.add(this.sky);
  }
  setDay(day, period = 0) {
    this.weather = day.weather;
    this.rain.visible = day.weather === "rain";
    const evening = period === 2;
    this.scene.background.set(
      evening ? "#c4a89e" : day.weather === "rain" ? "#99b4bd" : "#b6d3dc",
    );
    this.scene.fog.color.copy(this.scene.background);
    this.sun.color.set(evening ? "#ffbd87" : "#ffe3b0");
    this.sun.intensity = day.weather === "rain" ? 1.1 : evening ? 2.3 : 2.8;
    this.sun.position.set(evening ? -30 : -20, evening ? 16 : 34, 18);
    this.sky.material.uniforms.top.value.set(
      evening ? "#8f9eae" : day.weather === "rain" ? "#859da8" : "#649db9",
    );
    this.sky.material.uniforms.bottom.value.set(
      evening ? "#f0c7a0" : day.weather === "rain" ? "#bcc8c6" : "#eadbc2",
    );
    this.sea.material.uniforms.tint.value.set(
      evening ? "#467d8b" : day.weather === "rain" ? "#537d85" : "#4d9fa8",
    );
    for (const material of this.windowMaterials || [])
      material.emissiveIntensity = evening ? 0.65 : 0.06;
    this.renderer.shadowMap.needsUpdate = true;
    this.needsRender = true;
  }
  setMission(id) {
    const p = PLACES[id];
    this.mission = id;
    this.marker.position.set(p.x, 0.24, id === "park" ? p.z - 1 : p.z + 4.3);
  }
  resize() {
    const w = this.canvas.clientWidth,
      h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.overview) this.cameraDistance = this.overviewDistance();
    this.needsRender = true;
  }
  changeZoom(delta) {
    this.cameraDistance = THREE.MathUtils.clamp(
      this.cameraDistance * (1 - delta * 1.2),
      9,
      this.overview ? 140 : 34,
    );
    this.needsRender = true;
  }
  orbit(yaw, pitch = 0) {
    this.cameraYaw += yaw;
    this.cameraPitch = THREE.MathUtils.clamp(
      this.cameraPitch + pitch,
      0.38,
      1.25,
    );
    this.needsRender = true;
    this.cameraTransitionUntil = this.elapsed + 0.5;
  }
  toggleOverview() {
    this.overview = !this.overview;
    this.cameraDistance = this.overview
      ? this.overviewDistance()
      : innerWidth < 700
        ? 15
        : 18;
    this.cameraPitch = this.overview ? 1.04 : 0.66;
    this.playerTag.visible = this.overview;
    this.needsRender = true;
    this.cameraTransitionUntil = this.elapsed + 1;
    return this.overview;
  }
  overviewDistance() {
    return Math.max(
      36,
      44 /
        (2 *
          Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) *
          Math.max(0.4, this.camera.aspect)),
    );
  }
  focusConversation(place) {
    const npc = place ? this.neighbours[place] : null;
    this.conversationTarget =
      npc && npc.position.distanceTo(this.player.position) < 8 ? npc : null;
    this.cameraTransitionUntil = this.elapsed + 1;
    this.needsRender = true;
  }
  blocked(x, z) {
    return (
      Math.abs(x) > 21 ||
      Math.abs(z) > 20 ||
      this.obstacles.some(
        (o) => Math.abs(x - o.x) < o.w && Math.abs(z - o.z) < o.d,
      )
    );
  }
  navigate(x, z, onArrival) {
    if (this.blocked(x, z)) return false;
    const start = [
      Math.round(this.player.position.x),
      Math.round(this.player.position.z),
    ];
    const end = [Math.round(x), Math.round(z)];
    const key = (a, b) => `${a},${b}`;
    const frontier = [{ x: start[0], z: start[1], f: 0 }],
      came = new Map(),
      cost = new Map([[key(...start), 0]]);
    let found = false;
    for (
      let iterations = 0;
      frontier.length && iterations < 2200;
      iterations++
    ) {
      frontier.sort((a, b) => a.f - b.f);
      const cur = frontier.shift();
      if (cur.x === end[0] && cur.z === end[1]) {
        found = true;
        break;
      }
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ]) {
        const nx = cur.x + dx,
          nz = cur.z + dz;
        if (
          this.blocked(nx, nz) ||
          this.blocked(cur.x + dx, cur.z) ||
          this.blocked(cur.x, cur.z + dz)
        )
          continue;
        const nc = cost.get(key(cur.x, cur.z)) + Math.hypot(dx, dz),
          nk = key(nx, nz);
        if (nc >= (cost.get(nk) ?? Infinity)) continue;
        cost.set(nk, nc);
        came.set(nk, [cur.x, cur.z]);
        frontier.push({
          x: nx,
          z: nz,
          f: nc + Math.hypot(nx - end[0], nz - end[1]),
        });
      }
    }
    if (!found) {
      this.callbacks.onMessage?.("Approchez-vous par le chemin.");
      return false;
    }
    const result = [end];
    let current = end;
    while (key(...current) !== key(...start)) {
      current = came.get(key(...current));
      if (!current) break;
      result.push(current);
    }
    this.path = result
      .reverse()
      .slice(1)
      .map(([px, pz]) => new THREE.Vector3(px, 0.1, pz));
    this.path.push(new THREE.Vector3(x, 0.1, z));
    this.onArrival = onArrival;
    this.targetDisc.position.set(x, 0.25, z);
    this.targetDisc.visible = true;
    return true;
  }
  goTo(id, onArrival) {
    const p = PLACES[id];
    return this.navigate(p.x, id === "park" ? p.z - 1 : p.z + 4.8, onArrival);
  }
  distanceTo(id) {
    const p = PLACES[id];
    return Math.hypot(
      this.player.position.x - p.x,
      this.player.position.z - (id === "park" ? p.z - 1 : p.z + 4.8),
    );
  }
  performActivity(pose) {
    this.activity = pose;
    this.activityUntil = this.elapsed + 5;
    this.path = [];
    this.activityProp.visible = ["read", "work", "eat"].includes(pose);
  }
  click(event) {
    if (this.paused) return;
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      (-(event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const target = this.raycaster.intersectObjects(this.pickables, true)[0];
    if (target?.object.userData.place) {
      this.callbacks.onPlace?.(target.object.userData.place);
      return;
    }
    const ground = this.raycaster.intersectObject(this.ground)[0];
    if (ground) this.navigate(ground.point.x, ground.point.z);
  }
  animate() {
    this.frame = requestAnimationFrame(() => this.animate());
    this.clock.update();
    const dt = Math.min(this.clock.getDelta(), 2);
    this.elapsed += dt;
    let moving = false;
    if (!this.paused && !document.hidden) {
      // Simulate small collision-safe steps even when a device renders slowly.
      // Movement speed must not depend on the display's frame rate.
      const ticks = Math.max(1, Math.ceil(dt / 0.04));
      for (let tick = 0; tick < ticks; tick++) {
        if (this.paused) break;
        let x =
          (this.keys.has("d") || this.keys.has("arrowright") ? 1 : 0) -
          (this.keys.has("a") ||
          this.keys.has("q") ||
          this.keys.has("arrowleft")
            ? 1
            : 0) +
          this.stick.x;
        let z =
          (this.keys.has("s") || this.keys.has("arrowdown") ? 1 : 0) -
          (this.keys.has("w") || this.keys.has("z") || this.keys.has("arrowup")
            ? 1
            : 0) +
          this.stick.z;
        let direction;
        if (Math.hypot(x, z) > 0.1) {
          this.path = [];
          this.onArrival = null;
          this.targetDisc.visible = false;
          direction = new THREE.Vector3(
            x * Math.cos(this.cameraYaw) + z * Math.sin(this.cameraYaw),
            0,
            -x * Math.sin(this.cameraYaw) + z * Math.cos(this.cameraYaw),
          ).normalize();
        } else if (this.path.length) {
          direction = this.path[0].clone().sub(this.player.position);
          direction.y = 0;
          if (direction.length() < 0.18) {
            this.path.shift();
            direction = null;
            if (!this.path.length) {
              this.targetDisc.visible = false;
              const cb = this.onArrival;
              this.onArrival = null;
              cb?.();
            }
          } else direction.normalize();
        }
        if (direction) {
          const speed = Math.min(
            (dt / ticks) * 4.6,
            this.path.length
              ? this.path[0].distanceTo(this.player.position)
              : Infinity,
          );
          const nx = this.player.position.x + direction.x * speed,
            nz = this.player.position.z + direction.z * speed;
          if (!this.blocked(nx, this.player.position.z))
            this.player.position.x = nx;
          if (!this.blocked(this.player.position.x, nz))
            this.player.position.z = nz;
          const angle = Math.atan2(direction.x, direction.z);
          this.player.rotation.y +=
            Math.atan2(
              Math.sin(angle - this.player.rotation.y),
              Math.cos(angle - this.player.rotation.y),
            ) * Math.min(1, (dt / ticks) * 14);
          moving = true;
        }
      }
    }
    this.player.userData.limbs.forEach(
      (limb, i) =>
        (limb.rotation.x =
          moving && !this.reducedMotion
            ? Math.sin(this.elapsed * 10 + (i % 2) * Math.PI) * 0.4
            : 0),
    );
    const activityActive =
      this.activity && this.elapsed < this.activityUntil && !moving;
    const pose = moving ? "walk" : activityActive ? this.activity : "idle";
    this.player.userData.rig?.update(Math.min(dt, 0.1), pose);
    this.canvas.dataset.animation = pose;
    for (const root of Object.values(this.neighbours))
      root.userData.rig?.update(Math.min(dt, 0.1), "idle");
    if (this.activity && this.elapsed < this.activityUntil && !moving) {
      if (this.activity === "exercise")
        this.player.userData.limbs.forEach(
          (limb, i) =>
            (limb.rotation.x =
              Math.sin(this.elapsed * 9 + (i % 2) * Math.PI) * 0.45),
        );
      else {
        this.player.userData.limbs[2].rotation.x = -0.8;
        this.player.userData.limbs[3].rotation.x = -0.8;
      }
    } else {
      this.activity = null;
      this.activityProp.visible = false;
    }
    this.pin.position.y =
      2.7 + (this.reducedMotion ? 0 : Math.sin(this.elapsed * 2) * 0.18);
    this.pin.rotation.y = this.elapsed * 0.5;
    if (!this.reducedMotion)
      this.clouds.forEach((c, i) => {
        c.position.x += dt * 0.13;
        if (c.position.x > 65) c.position.x = -65;
      });
    if (this.rain.visible && !this.reducedMotion) {
      const p = this.rain.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        let y = p.getY(i) - dt * 12;
        if (y < 0) y = 25;
        p.setY(i, y);
      }
      p.needsUpdate = true;
    }
    if (this.sea) this.sea.material.uniforms.time.value = this.elapsed;
    if (!this.reducedMotion)
      this.birds?.forEach((bird, i) => {
        bird.position.x = -21 + i * 4 + Math.sin(this.elapsed * 0.08 + i) * 3;
        bird.children.forEach(
          (wing, j) =>
            (wing.rotation.z =
              (j ? 1 : -1) * (0.15 + Math.sin(this.elapsed * 4 + i) * 0.3)),
        );
      });
    const desired = this.overview
      ? new THREE.Vector3(0, 1, 0)
      : this.player.position.clone().add(new THREE.Vector3(0, 1.35, 0));
    if (this.conversationTarget && !this.overview)
      desired.add(
        this.conversationTarget.position
          .clone()
          .sub(this.player.position)
          .multiplyScalar(0.4),
      );
    this.cameraFocus.lerp(
      desired,
      this.reducedMotion ? 1 : 1 - Math.exp(-dt * 5),
    );
    const radius = this.cameraDistance;
    // A distant mobile overview must stay clear instead of disappearing into fog.
    this.scene.fog.near = this.overview ? radius + 20 : 48;
    this.scene.fog.far = this.overview ? radius + 120 : 115;
    const offset = new THREE.Vector3(
      Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * radius,
      Math.sin(this.cameraPitch) * radius,
      Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * radius,
    );
    this.camera.position.copy(this.cameraFocus).add(offset);
    this.camera.lookAt(this.cameraFocus);
    const start = this.player.position
      .clone()
      .add(new THREE.Vector3(0, 1.5, 0));
    const ray = new THREE.Ray(
      start,
      this.camera.position.clone().sub(start).normalize(),
    );
    const hit = new THREE.Vector3();
    for (const building of this.occluders) {
      const obscures =
        !this.overview &&
        ray.intersectBox(building.box, hit) &&
        hit.distanceTo(start) < this.camera.position.distanceTo(start);
      const target = obscures ? 0.17 : 1;
      building.opacity = THREE.MathUtils.lerp(
        building.opacity,
        target,
        this.reducedMotion ? 1 : 1 - Math.exp(-dt * 8),
      );
      for (const material of building.materials) {
        const transparent = building.opacity < 0.98;
        if (material.transparent !== transparent) {
          material.transparent = transparent;
          material.needsUpdate = true;
        }
        material.opacity = transparent ? building.opacity : 1;
        material.depthWrite = !transparent;
      }
    }
    if (
      !document.hidden &&
      (!this.paused ||
        this.needsRender ||
        this.lastPaused !== this.paused ||
        this.elapsed < this.cameraTransitionUntil)
    ) {
      this.renderer.render(this.scene, this.camera);
      this.needsRender = false;
    }
    this.lastPaused = this.paused;
    if (this.elapsed - (this.lastPositionEvent || 0) > 0.2) {
      this.lastPositionEvent = this.elapsed;
      this.callbacks.onPosition?.(this.player.position);
    }
  }
}
