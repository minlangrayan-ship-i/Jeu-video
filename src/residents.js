import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { PLACES } from "./content.js";

function batchCharacter(source) {
  source.updateMatrixWorld(true);
  const meshes = [];
  source.traverse((o) => {
    if (o.isSkinnedMesh) meshes.push(o);
  });
  const first = meshes[0];
  if (
    !first ||
    !meshes.every(
      (m) =>
        m.material === first.material &&
        m.bindMatrix.equals(first.bindMatrix) &&
        m.matrixWorld.equals(first.matrixWorld) &&
        m.skeleton.bones.every((b, i) => b === first.skeleton.bones[i]),
    )
  )
    return;
  const geometry = mergeGeometries(meshes.map((m) => m.geometry));
  if (!geometry) return;
  const combined = new THREE.SkinnedMesh(geometry, first.material);
  combined.name = "Resident";
  combined.position.copy(first.position);
  combined.quaternion.copy(first.quaternion);
  combined.scale.copy(first.scale);
  first.parent.add(combined);
  combined.bind(first.skeleton, first.bindMatrix);
  meshes.forEach((m) => m.removeFromParent());
}

function headshot(source, clips, renderer) {
  const scene = new THREE.Scene(),
    root = new THREE.Group();
  scene.add(root);
  const rig = new ResidentRig(source, clips, root);
  rig.update(0.1, "idle");
  scene.add(new THREE.HemisphereLight("#e2f2ed", "#756349", 2.5));
  const light = new THREE.DirectionalLight("#ffe2b3", 3);
  light.position.set(-3, 5, 5);
  scene.add(light);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  camera.position.set(0.18, 2.2, 3.5);
  camera.lookAt(0, 2.05, 0);
  const target = new THREE.WebGLRenderTarget(128, 128);
  const previous = renderer.getRenderTarget(),
    clear = new THREE.Color();
  renderer.getClearColor(clear);
  const alpha = renderer.getClearAlpha();
  renderer.setRenderTarget(target);
  renderer.setClearColor("#e8d5ae", 1);
  renderer.render(scene, camera);
  const pixels = new Uint8Array(128 * 128 * 4);
  renderer.readRenderTargetPixels(target, 0, 0, 128, 128, pixels);
  renderer.setRenderTarget(previous);
  renderer.setClearColor(clear, alpha);
  target.dispose();
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const image = new ImageData(128, 128);
  for (let y = 0; y < 128; y++)
    image.data.set(pixels.subarray((127 - y) * 512, (128 - y) * 512), y * 512);
  canvas.getContext("2d").putImageData(image, 0, 0);
  rig.model.traverse((o) => {
    if (o.isMesh) o.material.dispose();
  });
  return canvas.toDataURL("image/png");
}

function contactShadow() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const c = canvas.getContext("2d"),
    gradient = c.createRadialGradient(32, 32, 0, 32, 32, 31);
  gradient.addColorStop(0, "rgba(30,43,30,.38)");
  gradient.addColorStop(0.4, "rgba(30,43,30,.25)");
  gradient.addColorStop(1, "rgba(30,43,30,0)");
  c.fillStyle = gradient;
  c.fillRect(0, 0, 64, 64);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 1.8),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(canvas),
      transparent: true,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.025;
  return shadow;
}

class ResidentRig {
  constructor(source, clips, root, scale = 1) {
    this.root = root;
    this.model = clone(source);
    const bounds = new THREE.Box3().setFromObject(this.model),
      height = bounds.max.y - bounds.min.y;
    const size = (2.65 / height) * scale;
    this.model.scale.setScalar(size);
    this.model.position.y = -bounds.min.y * size;
    this.model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = false;
      o.receiveShadow = true;
      o.frustumCulled = false;
      if (o.material) {
        o.material = o.material.clone();
        o.material.roughness = 0.82;
      }
    });
    root.add(this.model, contactShadow());
    this.mixer = new THREE.AnimationMixer(this.model);
    this.actions = new Map(
      clips.map((clip) => [clip.name, this.mixer.clipAction(clip)]),
    );
    this.play("Idle_A");
  }
  play(name) {
    if (this.actionName === name) return;
    const action = this.actions.get(name) || this.actions.get("Idle_A");
    if (!action) return;
    const previous = this.current;
    action.reset().setEffectiveWeight(1).fadeIn(0.22).play();
    if (previous) previous.fadeOut(0.22);
    this.current = action;
    this.actionName = name;
  }
  update(dt, mode) {
    this.play(
      mode === "walk"
        ? "Walking_A"
        : mode === "exercise"
          ? "Running_A"
          : mode === "eat" || mode === "read" || mode === "work"
            ? "Use_Item"
            : mode === "interact"
              ? "Interact"
              : "Idle_A",
    );
    this.mixer.update(dt);
  }
}

export async function loadResidents(world) {
  const loader = new GLTFLoader(),
    base = import.meta.env.BASE_URL + "models/";
  const [hero, neighbour, movement, gestures] = await Promise.all(
    ["resident.glb", "neighbour.glb", "movement.glb", "gestures.glb"].map(
      (file) => loader.loadAsync(base + file),
    ),
  );
  const clips = [...movement.animations, ...gestures.animations];
  // Source rigs share the same named KayKit skeleton. World movement is handled
  // by navigation; clips animate the skeleton without moving the controller.
  for (const clip of clips) {
    clip.tracks = clip.tracks.filter((t) => !/^root\.position$/i.test(t.name));
  }
  batchCharacter(hero.scene);
  batchCharacter(neighbour.scene);
  world.player.userData.fallback.visible = false;
  world.player.userData.rig = new ResidentRig(hero.scene, clips, world.player);
  for (const [id, root] of Object.entries(world.neighbours)) {
    root.userData.fallback.visible = false;
    const source = ["home", "cafe", "books"].includes(id)
      ? neighbour.scene
      : hero.scene;
    root.userData.rig = new ResidentRig(
      source,
      clips,
      root,
      id === "market" ? 1.02 : 0.94,
    );
  }
  world.canvas.dataset.character = "ready";
  world.portraits = {
    hero: headshot(hero.scene, clips, world.renderer),
    neighbour: headshot(neighbour.scene, clips, world.renderer),
  };
  world.callbacks.onAssetsReady?.();
  world.needsRender = true;
}

export function spawnNeighbours(world) {
  world.neighbours = {};
  for (const [id, p] of Object.entries(PLACES)) {
    const root = new THREE.Group();
    root.position.set(p.x + 1.65, 0.15, id === "park" ? p.z : p.z + 4.7);
    root.rotation.y = -0.25;
    const fallback = world.makePerson(p.tone, "#67503b");
    fallback.scale.setScalar(0.9);
    root.userData.fallback = fallback;
    root.add(fallback);
    world.scene.add(root);
    world.neighbours[id] = root;
  }
}
