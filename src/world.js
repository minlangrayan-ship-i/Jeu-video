import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PLACES } from './content.js';

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.87, ...extra });
const UP = new THREE.Vector3(0, 1, 0);

export class HarbourWorld {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#b9d1cc');
    this.scene.fog = new THREE.Fog('#b9d1cc', 65, 135);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.22;
    this.camera = new THREE.OrthographicCamera(-30, 30, 25, -25, 0.1, 180);
    this.zoom = innerWidth < 700 ? 0.73 : 0.93;
    this.cameraFocus = new THREE.Vector3(-1, 0, 0);
    this.scene.add(new THREE.HemisphereLight('#fff6df', '#778b7b', 2.9));
    this.sun = new THREE.DirectionalLight('#ffe3b0', 3.4);
    this.sun.position.set(-20, 34, 18);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    Object.assign(this.sun.shadow.camera, { left: -34, right: 34, top: 34, bottom: -34, near: 1, far: 90 });
    this.sun.shadow.normalBias = 0.05;
    this.scene.add(this.sun);
    this.materials = {};
    this.pickables = [];
    this.obstacles = [];
    this.clouds = [];
    this.keys = new Set();
    this.stick = { x: 0, z: 0 };
    this.path = [];
    this.clock = new THREE.Clock();
    this.elapsed = 0;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.buildTown();
    this.optimiseTown();
    this.player = this.makePerson('#356d68', '#d87745', true);
    this.player.traverse(o=>{o.castShadow=false;});
    this.player.position.set(-12, 0.1, 14);
    this.scene.add(this.player);
    if(innerWidth<700) this.cameraFocus.copy(this.player.position).multiplyScalar(0.75).setY(0);
    const tagCanvas=document.createElement('canvas');tagCanvas.width=128;tagCanvas.height=48;
    const tagContext=tagCanvas.getContext('2d');tagContext.fillStyle='#244b3e';tagContext.beginPath();tagContext.roundRect(0,0,128,48,20);tagContext.fill();
    tagContext.fillStyle='#fff3d4';tagContext.font='600 25px sans-serif';tagContext.textAlign='center';tagContext.fillText('YOU',64,33);
    const tagTexture=new THREE.CanvasTexture(tagCanvas);tagTexture.colorSpace=THREE.SRGBColorSpace;
    const tag=new THREE.Sprite(new THREE.SpriteMaterial({map:tagTexture,depthTest:false,depthWrite:false}));
    tag.position.y=3.05;tag.scale.set(1.25,0.47,1);tag.renderOrder=1000;this.player.add(tag);
    this.activityProp=new THREE.Group();this.player.add(this.activityProp);this.activityProp.visible=false;
    this.box(0.55,0.12,0.4,'#e1b86a',0,1.2,0.6,this.activityProp);
    this.box(0.47,0.05,0.34,'#f8ebcf',0,1.29,0.6,this.activityProp);
    this.marker = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.06, 8, 40), mat('#ffb35d', { emissive: '#c27825', emissiveIntensity: 0.35 }));
    ring.rotation.x = -Math.PI / 2;
    this.marker.add(ring);
    this.pin = new THREE.Mesh(new THREE.OctahedronGeometry(0.33), mat('#ffc273'));
    this.pin.position.y = 2.7;
    this.marker.add(this.pin);
    this.scene.add(this.marker);
    this.targetDisc = new THREE.Mesh(new THREE.RingGeometry(0.27, 0.37, 32), new THREE.MeshBasicMaterial({ color: '#ffefca', side: THREE.DoubleSide }));
    this.targetDisc.rotation.x = -Math.PI / 2;
    this.targetDisc.visible = false;
    this.scene.add(this.targetDisc);
    this.createRain();
    this.resize = this.resize.bind(this);
    this.onKeyDown = e => {
      if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || document.querySelector('dialog[open]')) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      this.keys.add(e.key.toLowerCase());
    };
    this.onKeyUp = e => this.keys.delete(e.key.toLowerCase());
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', () => { this.keys.clear(); this.stick = { x: 0, z: 0 }; });
    window.addEventListener('resize', this.resize);
    let down;
    canvas.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
    canvas.addEventListener('pointerup', e => {
      if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 12) this.click(e);
    });
    this.resize();
    this.animate();
  }

  material(color) { return this.materials[color] ||= mat(color); }
  box(w, h, d, color, x, y, z, parent = this.scene) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.material(color));
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  sphere(radius, color, x, y, z, parent = this.scene, detail = 1) {
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, detail), this.material(color));
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }
  cylinder(r1, r2, h, color, x, y, z, parent = this.scene) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 10), this.material(color));
    mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); return mesh;
  }
  label(text, w, h, background = '#f8efd9', color = '#284a40') {
    const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 160;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = background; ctx.fillRect(0, 0, 768, 160);
    ctx.fillStyle = color; ctx.font = '600 64px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 384, 83, 730);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: texture }));
  }
  roof(width, height, depth, color, parent) {
    const shape = new THREE.Shape(); shape.moveTo(-width / 2, 0); shape.lineTo(0, height); shape.lineTo(width / 2, 0); shape.closePath();
    const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false }), this.material(color));
    roof.position.set(0, 5.5, -depth / 2); roof.castShadow = true; parent.add(roof);
  }
  building(id) {
    const p = PLACES[id];
    const group = new THREE.Group(); group.position.set(p.x, 0, p.z); group.userData.place = id; this.scene.add(group);
    const width = id === 'market' ? 7 : 6.5, depth = 5;
    this.box(width + 0.6, 0.3, depth + 0.6, '#d5ccba', 0, 0.15, 0, group);
    this.box(width, 5.3, depth, p.color, 0, 2.9, 0, group);
    this.box(width + 0.3, 0.22, depth + 0.3, '#f7e9cd', 0, 5.55, 0, group);
    this.roof(width + 0.6, 1.6, depth + 0.6, id === 'home' ? '#94695c' : '#596d69', group);
    this.box(0.65, 1.5, 0.65, '#a27563', 1.9, 6.5, -1, group);
    for (const x of [-2, 2]) {
      this.box(1.55, 1.5, 0.1, '#faeacd', x, 4.15, 2.56, group);
      this.box(1.25, 1.22, 0.13, '#598586', x, 4.15, 2.62, group);
      this.box(0.07, 1.27, 0.05, '#f8e7c8', x, 4.15, 2.71, group);
      this.box(1.28, 0.07, 0.05, '#f8e7c8', x, 4.15, 2.71, group);
      this.box(1.8, 0.15, 0.35, '#fff0d6', x, 3.35, 2.7, group);
      this.box(1.6, 1.7, 0.1, '#f7e8cb', x, 1.5, 2.56, group);
      this.box(1.35, 1.44, 0.1, '#476d6d', x, 1.5, 2.64, group);
      this.box(0.06, 1.5, 0.08, '#ecdcb9', x, 1.5, 2.72, group);
    }
    this.box(1.28, 2.4, 0.16, '#385b55', 0, 1.4, 2.58, group);
    this.box(0.92, 1.4, 0.05, '#739492', 0, 1.7, 2.68, group);
    this.sphere(0.07, '#dcb979', 0.43, 1.25, 2.79, group);
    this.box(1.7, 0.18, 0.8, '#dbcfb4', 0, 0.22, 2.8, group);
    const sign = this.label(p.name, 5.8, 0.8, id === 'cafe' ? '#254e46' : '#f7e9cc', id === 'cafe' ? '#f7e9cc' : '#345b4b');
    sign.position.set(0, 2.95, 2.7); group.add(sign);
    if (id === 'cafe' || id === 'market') {
      const stripe = id === 'cafe' ? '#c9754e' : '#648965';
      for (let i = 0; i < 10; i++) {
        const m = this.box(0.64, 0.12, 1.5, i % 2 ? '#f6e5bc' : stripe, -2.88 + i * 0.64, 2.65, 3.2, group);
        m.rotation.x = 0.17;
        this.box(0.64, 0.28, 0.1, i % 2 ? '#f6e5bc' : stripe, -2.88 + i * 0.64, 2.38, 3.92, group);
      }
    }
    if (id === 'market') {
      for (const x of [-2.4, 2.4]) {
        this.box(1.6, 0.7, 1.1, '#b78d58', x, 0.55, 3.8, group);
        for (let n = 0; n < 8; n++) this.sphere(0.17, x < 0 ? '#d9865f' : '#b4bd65', x - 0.5 + (n % 4) * 0.32, 0.98, 3.55 + Math.floor(n / 4) * 0.4, group, 0);
      }
    }
    for (const x of [-3.4, 3.4]) this.planter(p.x + x, p.z + 3.1);
    group.traverse(obj => { obj.userData.place = id; });
    this.pickables.push(group);
    this.obstacles.push({ x: p.x, z: p.z, w: width / 2 + 0.35, d: depth / 2 + 0.35 });
  }
  tree(x, z, scale = 1, hue = '#89a67a') {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(scale); this.scene.add(g);
    this.cylinder(0.17, 0.24, 2.5, '#88745b', 0, 1.25, 0, g);
    this.sphere(1.45, hue, 0, 3.3, 0, g);
    this.sphere(1.0, '#a6ba8b', -0.55, 3.9, 0.2, g);
    this.sphere(0.8, hue, 0.8, 3.1, 0.2, g);
  }
  planter(x, z) {
    this.cylinder(0.42, 0.3, 0.65, '#bb8263', x, 0.4, z);
    this.sphere(0.5, '#839b69', x, 0.95, z);
    this.sphere(0.12, '#ecc68a', x + 0.15, 1.35, z);
  }
  bench(x, z, angle = 0) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = angle; this.scene.add(g);
    for (const q of [-0.7, 0.7]) { this.box(0.12, 0.75, 0.8, '#405d53', q, 0.4, 0, g); this.box(0.12, 1.3, 0.12, '#405d53', q, 0.7, -0.4, g); }
    for (let i = 0; i < 3; i++) this.box(2.1, 0.12, 0.22, '#bc9870', 0, 0.8, -0.25 + i * 0.24, g);
    for (let i = 0; i < 2; i++) this.box(2.1, 0.19, 0.12, '#bc9870', 0, 1.15 + i * 0.25, -0.4, g);
  }
  lamp(x, z) {
    this.cylinder(0.07, 0.13, 3.9, '#466359', x, 1.95, z);
    this.box(0.48, 0.7, 0.48, '#f4ddb0', x, 4, z);
    this.box(0.67, 0.12, 0.67, '#466359', x, 4.4, z);
    this.cylinder(0.05, 0.15, 0.3, '#466359', x, 4.6, z);
  }
  buildTown() {
    const water = this.box(250, 0.8, 250, '#93b6b5', 0, -1.8, 0);
    water.receiveShadow = false;
    this.box(45, 1.2, 43, '#a0b18d', 0, -0.65, 0);
    this.box(45, 0.12, 7, '#d7d2bd', 0, 0.03, 0);
    this.box(7, 0.12, 43, '#d7d2bd', 0, 0.035, 0);
    this.box(45, 0.08, 4.6, '#7c9288', 0, 0.12, 0);
    this.box(4.6, 0.08, 43, '#7c9288', 0, 0.125, 0);
    for (let x = -20; x <= 20; x += 4) {
      if (Math.abs(x) > 4) this.box(1.5, 0.01, 0.09, '#ddd9bd', x, 0.17, 0);
    }
    for (let z = -18; z <= 18; z += 4) {
      if (Math.abs(z) > 4) this.box(0.09, 0.01, 1.5, '#ddd9bd', 0, 0.18, z);
    }
    for (let i = 0; i < 5; i++) this.box(0.45, 0.015, 3.8, '#ece7d0', -1.25 + i * 0.65, 0.19, 4.8);
    for (const id of ['home', 'cafe', 'market', 'work', 'books']) {
      this.building(id);
      const p = PLACES[id]; this.box(2.1, 0.07, 5.5, '#d8d0b6', p.x, 0.09, p.z + 5.3);
    }
    // The park's path, pond, flower beds and pergola.
    this.box(13, 0.08, 12, '#93af83', 12, 0.06, 10);
    this.box(2.1, 0.06, 11, '#d9cfac', 12, 0.12, 9);
    const pond = this.cylinder(2.1, 2.1, 0.13, '#c7c5a7', 16, 0.18, 11);
    pond.scale.z = 0.7;
    const inside = this.cylinder(1.8, 1.8, 0.14, '#7faeaa', 16, 0.21, 11); inside.scale.z = 0.7;
    const parkSign = this.label('Meadow Park', 4, 0.8, '#3e6453', '#f5e9cb'); parkSign.position.set(12, 2.4, 6); this.scene.add(parkSign); parkSign.userData.place = 'park'; this.pickables.push(parkSign);
    this.box(0.13, 2.5, 0.13, '#6f7c59', 10.5, 1.25, 6); this.box(0.13, 2.5, 0.13, '#6f7c59', 13.5, 1.25, 6);
    this.bench(15, 7, -0.5); this.bench(9, 12, 0.6);
    this.bench(-16, -3.6); this.bench(5, -5.2, Math.PI);
    // Café pavement tables.
    for (const x of [-15.8, -7.2]) {
      this.cylinder(0.62, 0.62, 0.12, '#d1b78b', x, 1.1, -3.9);
      this.cylinder(0.07, 0.15, 1, '#546c59', x, 0.55, -3.9);
      this.cylinder(0.15, 0.12, 0.22, '#f5e8cb', x, 1.28, -3.9);
      this.bench(x, -2.9);
    }
    const trees = [[-19,-16,1.2],[-19,-9,0.9],[-18,7,1.1],[-18,15,1.2],[-8,17,0.9],[5,17,1],[18,16,1.2],[18,6,1],[8,14,0.8],[18,-15,1.1],[7,-16,0.9],[-5,-18,1],[20,-3,1],[-7,7,0.75]];
    trees.forEach(([x,z,s], i) => this.tree(x,z,s,i % 3 === 0 ? '#b0b484' : '#89a67a'));
    [[-5,-4], [5,4], [-5,5], [5,-5], [-20,1], [20,-1]].forEach(([x,z]) => this.lamp(x,z));
    for (let i = 0; i < 18; i++) {
      const x = 7.7 + i % 6 * 0.55, z = 16 + Math.floor(i / 6) * 0.5;
      this.sphere(0.19, ['#e9bba0','#efdb99','#c99aa0'][i % 3], x, 0.33, z, this.scene, 0);
    }
    // Quayside on the west of the island.
    this.box(4, 0.35, 17, '#b9a889', -23.5, -0.1, 2);
    for (let i = 0; i < 18; i++) this.box(3.95, 0.03, 0.07, '#9b896c', -23.5, 0.1, -6 + i * 0.9);
    for (let i = 0; i < 6; i++) this.cylinder(0.15, 0.18, 1, '#847c63', -25.1, 0.4, -5 + i * 2.7);
    // A tiny boat and water glints.
    const boat = this.box(1.8, 0.45, 3.8, '#e4c6a1', -28, -0.6, 4); boat.rotation.y = 0.35;
    this.box(1.35, 0.6, 1.5, '#f0ead4', -28, -0.1, 4);
    this.cylinder(0.04, 0.04, 3, '#8d8772', -28, 1, 4);
    for (let i = 0; i < 28; i++) {
      this.box(0.6 + (i % 4) * 0.3, 0.02, 0.06, '#b7cdca', -27 - (i % 5) * 2.3, -1.35, -22 + i * 1.7);
    }
    for (let i = 0; i < 6; i++) {
      const cloud = new THREE.Group(); cloud.position.set(-38 + i * 14, 18 + i % 2 * 4, -18 - i % 3 * 9);
      for (let j = 0; j < 3; j++) {
        const puff = this.sphere(1.6, '#eef0de', j * 1.8, j % 2 * 0.5, 0, cloud); puff.scale.set(1.5, 0.55, 0.8); puff.castShadow = false;
      }
      this.scene.add(cloud); this.clouds.push(cloud);
    }
    for (const [id, p] of Object.entries(PLACES)) {
      const npc = this.makePerson(p.tone, id === 'cafe' ? '#614437' : '#685343');
      npc.scale.setScalar(0.88); npc.position.set(p.x + (id === 'park' ? 1.2 : 1.7), 0.15, id === 'park' ? p.z : p.z + 4.7);
      npc.rotation.y = -0.3; npc.userData.place = id; npc.traverse(o => { o.userData.place = id; }); this.pickables.push(npc); this.scene.add(npc);
    }
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(45, 43), new THREE.MeshBasicMaterial({ visible: false }));
    this.ground.rotation.x = -Math.PI / 2; this.ground.position.y = 0.22; this.scene.add(this.ground);
  }
  makePerson(jacket = '#356d68', hair = '#d87745', player = false) {
    const g = new THREE.Group();
    const skin = '#e9b68c';
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.6, 24), new THREE.MeshBasicMaterial({ color: '#3a5441', transparent: true, opacity: 0.16, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.05; g.add(shadow);
    const left = this.box(0.27, 0.73, 0.32, '#334d56', -0.2, 0.48, 0, g);
    const right = this.box(0.27, 0.73, 0.32, '#334d56', 0.2, 0.48, 0, g);
    this.box(0.3, 0.18, 0.47, '#eee3cc', -0.2, 0.15, 0.08, g); this.box(0.3, 0.18, 0.47, '#eee3cc', 0.2, 0.15, 0.08, g);
    this.cylinder(0.38, 0.43, 0.83, jacket, 0, 1.22, 0, g);
    const armL = this.box(0.22, 0.7, 0.26, jacket, -0.48, 1.2, 0, g);
    const armR = this.box(0.22, 0.7, 0.26, jacket, 0.48, 1.2, 0, g);
    this.sphere(0.14, skin, -0.48, 0.83, 0, g); this.sphere(0.14, skin, 0.48, 0.83, 0, g);
    this.sphere(0.42, skin, 0, 1.99, 0, g, 2);
    for (let i = 0; i < 7; i++) this.sphere(0.22, hair, Math.cos(i) * 0.25, 2.2 + Math.sin(i) * 0.08, -0.05 + Math.sin(i) * 0.2, g);
    this.sphere(0.035, '#353d32', -0.14, 1.99, 0.37, g); this.sphere(0.035, '#353d32', 0.14, 1.99, 0.37, g);
    this.sphere(0.065, skin, 0, 1.87, 0.41, g);
    if (player) {
      this.box(0.65, 0.57, 0.3, '#d69b54', 0, 1.22, -0.43, g);
      this.box(0.5, 0.26, 0.07, '#b88045', 0, 1.1, -0.62, g);
      this.box(0.43, 0.16, 0.5, '#f0c573', 0, 1.66, 0, g);
      this.box(0.15, 0.4, 0.1, '#f0c573', -0.16, 1.43, 0.37, g);
    }
    g.userData.limbs = [left, right, armL, armR]; return g;
  }
  optimiseTown() {
    // Batch static geometry by material: a few dozen draw calls instead of
    // hundreds of individual windows, leaves and paving stones on mobile.
    this.scene.updateMatrixWorld(true);
    const batches = new Map(), originals = [];
    this.scene.traverse(object => {
      if (!object.isMesh || object === this.ground || this.clouds.some(c => c === object.parent)) return;
      const material = object.material;
      if (Array.isArray(material)) return;
      const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
      geometry.applyMatrix4(object.matrixWorld);
      const key = material.isMeshStandardMaterial && !material.transparent ? 'vertex-colours' : material.uuid;
      if(key === 'vertex-colours') {
        const colours=new Float32Array(geometry.attributes.position.count*3);
        for(let i=0;i<colours.length;i+=3){colours[i]=material.color.r;colours[i+1]=material.color.g;colours[i+2]=material.color.b;}
        geometry.setAttribute('color',new THREE.BufferAttribute(colours,3));
      }
      let batch = batches.get(key);
      if (!batch) { batch = { material:key==='vertex-colours'?mat('#ffffff',{vertexColors:true}):material, geometries: [] }; batches.set(key,batch); }
      batch.geometries.push(geometry); originals.push(object);
    });
    for (const {material,geometries} of batches.values()) {
      const geometry = mergeGeometries(geometries);
      if (!geometry) continue;
      const mesh = new THREE.Mesh(geometry,material);
      mesh.castShadow = !material.transparent; mesh.receiveShadow = true; this.scene.add(mesh);
      geometries.forEach(g=>g.dispose());
    }
    originals.forEach(object=>{object.removeFromParent();object.geometry.dispose();});
    this.pickables = [];
    for (const [id,p] of Object.entries(PLACES)) {
      const proxy = new THREE.Mesh(new THREE.BoxGeometry(6.8,id==='park'?2.5:7,5.4),new THREE.MeshBasicMaterial({visible:false}));
      proxy.position.set(p.x,id==='park'?1.25:3.5,p.z);
      proxy.userData.place=id;this.scene.add(proxy);this.pickables.push(proxy);
    }
  }
  createRain() {
    const positions = new Float32Array(600 * 3);
    for (let i = 0; i < positions.length; i += 3) { positions[i] = Math.random() * 50 - 25; positions[i+1] = Math.random() * 25; positions[i+2] = Math.random() * 50 - 25; }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.rain = new THREE.Points(geometry, new THREE.PointsMaterial({ color: '#e3eee8', size: 0.1, transparent: true, opacity: 0.7 }));
    this.rain.visible = false; this.scene.add(this.rain);
  }
  setDay(day, period = 0) {
    this.weather = day.weather;
    this.rain.visible = day.weather === 'rain';
    const evening = period === 2;
    this.scene.background.set(evening ? '#b9b6b4' : day.weather === 'rain' ? '#afc1c1' : '#b9d1cc');
    this.scene.fog.color.copy(this.scene.background);
    this.sun.color.set(evening ? '#ffbd87' : '#ffe3b0');
    this.sun.intensity = day.weather === 'rain' ? 1.3 : evening ? 2.5 : 3.4;
    this.sun.position.set(evening ? -30 : -20, evening ? 16 : 34, 18);
    this.renderer.shadowMap.needsUpdate=true;
    this.needsRender=true;
  }
  setMission(id) {
    const p = PLACES[id]; this.mission = id;
    this.marker.position.set(p.x, 0.24, id === 'park' ? p.z - 1 : p.z + 4.3);
  }
  resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    const size = innerWidth < 700 ? 22 : 27;
    this.camera.left = -size * w / h / 2; this.camera.right = size * w / h / 2;
    this.camera.top = size / 2; this.camera.bottom = -size / 2;
    this.camera.zoom = this.zoom; this.camera.updateProjectionMatrix();
    this.needsRender=true;
  }
  changeZoom(delta) { this.zoom = THREE.MathUtils.clamp(this.zoom + delta, 0.5, 1.7); this.resize(); }
  blocked(x, z) { return Math.abs(x) > 21 || Math.abs(z) > 20 || this.obstacles.some(o => Math.abs(x - o.x) < o.w && Math.abs(z - o.z) < o.d); }
  navigate(x, z, onArrival) {
    if (this.blocked(x, z)) return false;
    const start = [Math.round(this.player.position.x), Math.round(this.player.position.z)];
    const end = [Math.round(x), Math.round(z)];
    const key = (a, b) => `${a},${b}`;
    const frontier = [{ x: start[0], z: start[1], f: 0 }], came = new Map(), cost = new Map([[key(...start), 0]]);
    let found = false;
    for (let iterations = 0; frontier.length && iterations < 2200; iterations++) {
      frontier.sort((a,b) => a.f - b.f); const cur = frontier.shift();
      if (cur.x === end[0] && cur.z === end[1]) { found = true; break; }
      for (const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
        const nx=cur.x+dx, nz=cur.z+dz;
        if (this.blocked(nx,nz) || this.blocked(cur.x+dx,cur.z) || this.blocked(cur.x,cur.z+dz)) continue;
        const nc = cost.get(key(cur.x,cur.z)) + Math.hypot(dx,dz), nk = key(nx,nz);
        if (nc >= (cost.get(nk) ?? Infinity)) continue;
        cost.set(nk,nc); came.set(nk,[cur.x,cur.z]); frontier.push({x:nx,z:nz,f:nc+Math.hypot(nx-end[0],nz-end[1])});
      }
    }
    if (!found) { this.callbacks.onMessage?.('Approchez-vous par le chemin.'); return false; }
    const result = [end]; let current = end;
    while (key(...current) !== key(...start)) { current = came.get(key(...current)); if (!current) break; result.push(current); }
    this.path = result.reverse().slice(1).map(([px,pz]) => new THREE.Vector3(px,0.1,pz));
    this.path.push(new THREE.Vector3(x,0.1,z)); this.onArrival = onArrival;
    this.targetDisc.position.set(x,0.25,z); this.targetDisc.visible = true;
    return true;
  }
  goTo(id, onArrival) { const p=PLACES[id]; return this.navigate(p.x, id === 'park' ? p.z - 1 : p.z + 4.8,onArrival); }
  distanceTo(id) { const p=PLACES[id]; return Math.hypot(this.player.position.x-p.x,this.player.position.z-(id === 'park' ? p.z - 1 : p.z+4.8)); }
  performActivity(pose) { this.activity=pose;this.activityUntil=this.elapsed+5;this.path=[];this.activityProp.visible=['read','work','eat'].includes(pose); }
  click(event) {
    if (this.paused) return;
    const rect=this.canvas.getBoundingClientRect();
    this.pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
    this.raycaster.setFromCamera(this.pointer,this.camera);
    const target=this.raycaster.intersectObjects(this.pickables,true)[0];
    if (target?.object.userData.place) { this.callbacks.onPlace?.(target.object.userData.place); return; }
    const ground=this.raycaster.intersectObject(this.ground)[0];
    if (ground) this.navigate(ground.point.x,ground.point.z);
  }
  animate() {
    this.frame = requestAnimationFrame(() => this.animate());
    const dt = Math.min(this.clock.getDelta(), 0.5); this.elapsed += dt;
    let moving=false;
    if (!this.paused && !document.hidden) {
      // Simulate small collision-safe steps even when a device renders slowly.
      // Movement speed must not depend on the display's frame rate.
      const ticks=Math.max(1,Math.ceil(dt/0.04));
      for(let tick=0;tick<ticks;tick++) {
      if(this.paused) break;
      let x=(this.keys.has('d')||this.keys.has('arrowright')?1:0)-(this.keys.has('a')||this.keys.has('q')||this.keys.has('arrowleft')?1:0)+this.stick.x;
      let z=(this.keys.has('s')||this.keys.has('arrowdown')?1:0)-(this.keys.has('w')||this.keys.has('z')||this.keys.has('arrowup')?1:0)+this.stick.z;
      let direction;
      if (Math.hypot(x,z)>0.1) {
        this.path=[]; this.onArrival=null; this.targetDisc.visible=false;
        direction=new THREE.Vector3(x+z,0,z-x).normalize();
      } else if (this.path.length) {
        direction=this.path[0].clone().sub(this.player.position); direction.y=0;
        if (direction.length()<0.18) { this.path.shift(); direction=null; if (!this.path.length) { this.targetDisc.visible=false; const cb=this.onArrival; this.onArrival=null; cb?.(); } }
        else direction.normalize();
      }
      if (direction) {
        const speed=Math.min(dt/ticks*4.6,this.path.length ? this.path[0].distanceTo(this.player.position) : Infinity);
        const nx=this.player.position.x+direction.x*speed,nz=this.player.position.z+direction.z*speed;
        if (!this.blocked(nx,this.player.position.z)) this.player.position.x=nx;
        if (!this.blocked(this.player.position.x,nz)) this.player.position.z=nz;
        const angle=Math.atan2(direction.x,direction.z);
        this.player.rotation.y=angle;
        moving=true;
      }
      }
    }
    this.player.userData.limbs.forEach((limb,i) => limb.rotation.x=moving&&!this.reducedMotion?Math.sin(this.elapsed*10+(i%2)*Math.PI)*0.4:0);
    if(this.activity&&this.elapsed<this.activityUntil&&!moving) {
      if(this.activity==='exercise')this.player.userData.limbs.forEach((limb,i)=>limb.rotation.x=Math.sin(this.elapsed*9+(i%2)*Math.PI)*0.45);
      else {this.player.userData.limbs[2].rotation.x=-0.8;this.player.userData.limbs[3].rotation.x=-0.8;}
    } else {this.activity=null;this.activityProp.visible=false;}
    this.pin.position.y=2.7+(this.reducedMotion?0:Math.sin(this.elapsed*2)*0.18);
    this.pin.rotation.y=this.elapsed*0.5;
    if (!this.reducedMotion) this.clouds.forEach((c,i) => { c.position.x+=dt*0.13; if(c.position.x>65)c.position.x=-65; });
    if (this.rain.visible && !this.reducedMotion) {
      const p=this.rain.geometry.attributes.position;
      for(let i=0;i<p.count;i++) { let y=p.getY(i)-dt*12; if(y<0)y=25; p.setY(i,y); }
      p.needsUpdate=true;
    }
    const desired=new THREE.Vector3(this.player.position.x*0.27,0,this.player.position.z*0.27);
    // Keep a wider view on desktop so the town remains readable beside the HUD.
    if(innerWidth<700) desired.copy(this.player.position).multiplyScalar(0.75).setY(0);
    this.cameraFocus.lerp(desired,this.reducedMotion?1:1-Math.exp(-dt*2));
    this.camera.position.copy(this.cameraFocus).add(new THREE.Vector3(28,33,34));
    this.camera.lookAt(this.cameraFocus);
    if (!document.hidden && (!this.paused || this.needsRender || this.lastPaused !== this.paused)) {
      this.renderer.render(this.scene,this.camera);
      this.needsRender=false;
    }
    this.lastPaused=this.paused;
    if(this.elapsed-(this.lastPositionEvent||0)>0.2) { this.lastPositionEvent=this.elapsed; this.callbacks.onPosition?.(this.player.position); }
  }
}
