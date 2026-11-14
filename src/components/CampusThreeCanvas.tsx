import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CAMPUS_BUILDINGS } from '../data/seedData';
import { useTheme } from '../contexts/ThemeContext';

interface CampusThreeCanvasProps {
  activeBuilding?: string;
  onSelectBuilding?: (id: string) => void;
  heightClass?: string;
  showHudOverlay?: boolean;
}

interface BuildingSpec {
  id: string;
  code: string;
  name: string;
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
  accentHex: number;
  cameraOffset: [number, number, number];
}

const BUILDING_SPECS: BuildingSpec[] = [
  {
    id: 'north',
    code: 'NAB',
    name: 'North Academic Block',
    x: -3.2,
    z: -2.1,
    w: 2.0,
    h: 2.0,
    d: 1.45,
    accentHex: 0xe84d96,
    cameraOffset: [4.2, 4.4, 5.2],
  },
  {
    id: 'innovation',
    code: 'IC',
    name: 'Innovation Center',
    x: 2.4,
    z: -2.2,
    w: 2.1,
    h: 2.75,
    d: 1.6,
    accentHex: 0xc58a32,
    cameraOffset: [5.4, 4.8, 5.4],
  },
  {
    id: 'library',
    code: 'LIB',
    name: 'Central Library',
    x: -0.1,
    z: 0.35,
    w: 2.5,
    h: 1.55,
    d: 1.85,
    accentHex: 0x27866d,
    cameraOffset: [4.8, 4.2, 5.8],
  },
  {
    id: 'engineering',
    code: 'EA',
    name: 'Engineering Annex',
    x: 3.1,
    z: 2.35,
    w: 1.85,
    h: 2.2,
    d: 1.5,
    accentHex: 0x27866d,
    cameraOffset: [5.6, 4.3, 5.6],
  },
  {
    id: 'westquad',
    code: 'WRQ',
    name: 'West Residential Quad',
    x: -3.15,
    z: 2.45,
    w: 1.75,
    h: 1.35,
    d: 1.65,
    accentHex: 0xe84d96,
    cameraOffset: [4.5, 4.1, 5.8],
  },
];

// Reusable math objects outside render loop (zero GC)
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _targetCamPos = new THREE.Vector3(8.4, 6.4, 9.2);
const _targetLookAt = new THREE.Vector3(0, 0.7, 0);
const _dummyObj = new THREE.Object3D();

function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export function CampusThreeCanvas({
  activeBuilding = 'innovation',
  onSelectBuilding,
  heightClass = 'h-full min-h-[240px]',
  showHudOverlay = true,
}: CampusThreeCanvasProps) {
  const { theme } = useTheme();
  const mountRef = useRef<HTMLDivElement | null>(null);
  const activeBuildingRef = useRef(activeBuilding);
  const onSelectRef = useRef(onSelectBuilding);
  const themeRef = useRef(theme);
  const cameraTransitioningRef = useRef(false);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  activeBuildingRef.current = activeBuilding;
  onSelectRef.current = onSelectBuilding;
  themeRef.current = theme;

  // Trigger smooth camera focus whenever activeBuilding prop changes
  useEffect(() => {
    const spec = BUILDING_SPECS.find((b) => b.id === activeBuilding);
    if (spec) {
      _targetLookAt.set(spec.x * 0.45, spec.h * 0.35, spec.z * 0.45);
      _targetCamPos.set(
        spec.x + spec.cameraOffset[0],
        spec.cameraOffset[1],
        spec.z + spec.cameraOffset[2]
      );
      cameraTransitioningRef.current = true;
    }
  }, [activeBuilding]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const isSoftwareGl = detectSoftwareGl();
    let renderer: THREE.WebGLRenderer | null = null;
    let controls: OrbitControls | null = null;
    let frameId = 0;
    let disposed = false;

    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];

    try {
      const width = container.clientWidth || 640;
      const height = container.clientHeight || 340;

      const scene = new THREE.Scene();
      const bgHex = themeRef.current === 'dark' ? 0x16141c : 0xf6f3f6;
      scene.background = new THREE.Color(bgHex);
      scene.fog = new THREE.FogExp2(bgHex, 0.032);

      const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 80);
      camera.position.set(8.8, 6.6, 9.4);

      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = !isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
      scene.environment = envRT.texture;
      textures.push(envRT.texture);
      pmrem.dispose();

      // Studio-grade Warm Key + Cool Hemisphere + Pink Rim Lighting
      const hemi = new THREE.HemisphereLight(0xdbe8ff, 0x3a323e, 0.72);
      scene.add(hemi);

      const keyLight = new THREE.DirectionalLight(0xfff4ea, 1.35);
      keyLight.position.set(9, 14, 7);
      if (!isSoftwareGl) {
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(1024, 1024);
        keyLight.shadow.camera.near = 1;
        keyLight.shadow.camera.far = 35;
        keyLight.shadow.camera.left = -9;
        keyLight.shadow.camera.right = 9;
        keyLight.shadow.camera.top = 9;
        keyLight.shadow.camera.bottom = -9;
        keyLight.shadow.bias = -0.0005;
        keyLight.shadow.normalBias = 0.02;
      }
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0xe84d96, 0.45);
      rimLight.position.set(-8, 6, -9);
      scene.add(rimLight);

      // OrbitControls
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = !isSoftwareGl;
      controls.dampingFactor = 0.06;
      controls.maxPolarAngle = Math.PI / 2.15;
      controls.minPolarAngle = 0.28;
      controls.minDistance = 5.5;
      controls.maxDistance = 17;
      controls.target.set(0, 0.7, 0);
      controls.addEventListener('start', () => {
        cameraTransitioningRef.current = false;
      });

      // Procedural Campus Ground + Quad Pathways
      const campusRoot = new THREE.Group();
      scene.add(campusRoot);

      const groundGeo = new THREE.CircleGeometry(15, 48);
      groundGeo.rotateX(-Math.PI / 2);
      geometries.push(groundGeo);
      const groundMat = new THREE.MeshStandardMaterial({
        color: themeRef.current === 'dark' ? 0x1d1a24 : 0xefeaf0,
        roughness: 0.92,
        metalness: 0.04,
      });
      materials.push(groundMat);
      const groundMesh = new THREE.Mesh(groundGeo, groundMat);
      groundMesh.position.y = -0.02;
      groundMesh.receiveShadow = true;
      campusRoot.add(groundMesh);

      const gridHelper = new THREE.GridHelper(
        18,
        24,
        themeRef.current === 'dark' ? 0x3b3446 : 0xdad2dd,
        themeRef.current === 'dark' ? 0x26212e : 0xe7e1e9
      );
      gridHelper.position.y = -0.01;
      campusRoot.add(gridHelper);

      // Central Quad Plaza Ring
      const plazaGeo = new THREE.RingGeometry(1.4, 2.2, 48);
      plazaGeo.rotateX(-Math.PI / 2);
      geometries.push(plazaGeo);
      const plazaMat = new THREE.MeshStandardMaterial({
        color: 0xe84d96,
        roughness: 0.55,
        metalness: 0.2,
        transparent: true,
        opacity: 0.22,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
      materials.push(plazaMat);
      const plazaRing = new THREE.Mesh(plazaGeo, plazaMat);
      plazaRing.position.y = 0.015;
      campusRoot.add(plazaRing);

      // Composite Multi-Part Architectural Buildings
      const clickTargets: THREE.Mesh[] = [];
      const buildingRefs: Map<
        string,
        {
          shellMat: THREE.MeshStandardMaterial;
          beaconMat: THREE.MeshStandardMaterial;
          ringMesh: THREE.Mesh;
          beaconMesh: THREE.Mesh;
          baseY: number;
        }
      > = new Map();

      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x8db6d9,
        roughness: 0.14,
        metalness: 0.18,
        clearcoat: 0.85,
        clearcoatRoughness: 0.12,
        transparent: true,
        opacity: 0.72,
      });
      materials.push(glassMat);

      const plinthMat = new THREE.MeshStandardMaterial({
        color: 0x302b35,
        roughness: 0.78,
        metalness: 0.12,
      });
      materials.push(plinthMat);

      const solarMat = new THREE.MeshStandardMaterial({
        color: 0x1c2536,
        roughness: 0.25,
        metalness: 0.65,
      });
      materials.push(solarMat);

      BUILDING_SPECS.forEach((b) => {
        const bGroup = new THREE.Group();
        bGroup.position.set(b.x, 0, b.z);
        campusRoot.add(bGroup);

        // 1. Grounded architectural stone plinth
        const plinthGeo = new THREE.BoxGeometry(b.w + 0.28, 0.18, b.d + 0.28);
        geometries.push(plinthGeo);
        const plinth = new THREE.Mesh(plinthGeo, plinthMat);
        plinth.position.y = 0.09;
        plinth.receiveShadow = true;
        plinth.castShadow = true;
        bGroup.add(plinth);

        // 2. Primary structural mass
        const bodyGeo = new THREE.BoxGeometry(b.w, b.h, b.d);
        geometries.push(bodyGeo);
        const shellMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.42,
          metalness: 0.12,
        });
        materials.push(shellMat);
        const bodyMesh = new THREE.Mesh(bodyGeo, shellMat);
        bodyMesh.position.y = 0.18 + b.h / 2;
        bodyMesh.castShadow = true;
        bodyMesh.receiveShadow = true;
        bGroup.add(bodyMesh);

        // 3. Glazed smart facade band
        const glassGeo = new THREE.BoxGeometry(b.w + 0.03, b.h * 0.64, b.d * 0.74);
        geometries.push(glassGeo);
        const glassBand = new THREE.Mesh(glassGeo, glassMat);
        glassBand.position.y = 0.18 + b.h * 0.52;
        bGroup.add(glassBand);

        // 4. Architectural vertical louvers / fins
        const finGeo = new THREE.BoxGeometry(0.06, b.h * 0.85, b.d + 0.06);
        geometries.push(finGeo);
        for (let f = -1; f <= 1; f += 2) {
          const fin = new THREE.Mesh(finGeo, plinthMat);
          fin.position.set(f * (b.w * 0.34), 0.18 + b.h * 0.45, 0);
          bGroup.add(fin);
        }

        // 5. Rooftop mechanical penthouse + solar canopy
        const roofGeo = new THREE.BoxGeometry(b.w * 0.65, 0.22, b.d * 0.62);
        geometries.push(roofGeo);
        const roof = new THREE.Mesh(roofGeo, solarMat);
        roof.position.y = 0.18 + b.h + 0.11;
        roof.rotation.x = -0.08;
        roof.castShadow = true;
        bGroup.add(roof);

        // 6. Edge wireframe accent
        const edgeGeo = new THREE.EdgesGeometry(bodyGeo);
        geometries.push(edgeGeo);
        const edgeMat = new THREE.LineBasicMaterial({
          color: 0xcfc7d2,
          transparent: true,
          opacity: 0.55,
        });
        materials.push(edgeMat);
        const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
        bodyMesh.add(edgeLines);

        // 7. Ground Selection Halo Ring
        const ringGeo = new THREE.RingGeometry(
          Math.max(b.w, b.d) * 0.68,
          Math.max(b.w, b.d) * 0.78,
          36
        );
        ringGeo.rotateX(-Math.PI / 2);
        geometries.push(ringGeo);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xe84d96,
          transparent: true,
          opacity: 0.85,
          side: THREE.DoubleSide,
        });
        materials.push(ringMat);
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.y = 0.025;
        bGroup.add(ringMesh);

        // 8. Floating Roof Telemetry Beacon
        const beaconGeo = new THREE.OctahedronGeometry(0.16, 0);
        geometries.push(beaconGeo);
        const beaconMat = new THREE.MeshStandardMaterial({
          color: b.accentHex,
          emissive: b.accentHex,
          emissiveIntensity: 0.65,
          roughness: 0.2,
          metalness: 0.5,
        });
        materials.push(beaconMat);
        const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
        const beaconBaseY = 0.18 + b.h + 0.56;
        beaconMesh.position.y = beaconBaseY;
        bGroup.add(beaconMesh);

        // 9. Simplified Collider Box for fast raycasting
        const hitGeo = new THREE.BoxGeometry(b.w + 0.35, b.h + 0.9, b.d + 0.35);
        geometries.push(hitGeo);
        const hitMat = new THREE.MeshBasicMaterial({ visible: false });
        materials.push(hitMat);
        const hitMesh = new THREE.Mesh(hitGeo, hitMat);
        hitMesh.position.y = (b.h + 0.9) / 2;
        hitMesh.userData = { buildingId: b.id };
        bGroup.add(hitMesh);
        clickTargets.push(hitMesh);

        buildingRefs.set(b.id, {
          shellMat,
          beaconMat,
          ringMesh,
          beaconMesh,
          baseY: beaconBaseY,
        });
      });

      // Neural Data Pathways connecting buildings
      const pathPairs: [string, string][] = [
        ['north', 'library'],
        ['innovation', 'library'],
        ['library', 'engineering'],
        ['library', 'westquad'],
        ['north', 'innovation'],
        ['engineering', 'innovation'],
      ];

      const curves: THREE.CatmullRomCurve3[] = [];
      const tubeMat = new THREE.MeshStandardMaterial({
        color: 0xe84d96,
        emissive: 0xe84d96,
        emissiveIntensity: 0.45,
        roughness: 0.3,
        metalness: 0.2,
        transparent: true,
        opacity: 0.52,
      });
      materials.push(tubeMat);

      pathPairs.forEach(([fromId, toId]) => {
        const a = BUILDING_SPECS.find((s) => s.id === fromId);
        const b = BUILDING_SPECS.find((s) => s.id === toId);
        if (!a || !b) return;
        const midX = (a.x + b.x) / 2;
        const midZ = (a.z + b.z) / 2;
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(a.x, 0.22, a.z),
          new THREE.Vector3(midX, 0.85, midZ),
          new THREE.Vector3(b.x, 0.22, b.z),
        ]);
        curves.push(curve);
        const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.022, 6, false);
        geometries.push(tubeGeo);
        const tube = new THREE.Mesh(tubeGeo, tubeMat);
        campusRoot.add(tube);
      });

      // Instanced Data Packets flowing along neural pathways
      const packetGeo = new THREE.SphereGeometry(0.065, 10, 10);
      geometries.push(packetGeo);
      const packetMat = new THREE.MeshBasicMaterial({ color: 0xff8bc2 });
      materials.push(packetMat);
      const packetCount = curves.length * 3;
      const packetInstances = new THREE.InstancedMesh(packetGeo, packetMat, packetCount);
      packetInstances.frustumCulled = false;
      campusRoot.add(packetInstances);

      // Instanced Stylized Trees around Campus Perimeter
      const treePositions: [number, number][] = [
        [-4.9, -3.5],
        [-5.2, -0.4],
        [-4.8, 3.8],
        [-0.8, -4.1],
        [4.7, -3.6],
        [5.1, 0.2],
        [4.8, 4.1],
        [0.4, 4.3],
        [-1.7, 3.9],
        [1.9, -4.2],
      ];
      const foliageGeo = new THREE.ConeGeometry(0.32, 0.85, 7);
      foliageGeo.translate(0, 0.62, 0);
      geometries.push(foliageGeo);
      const foliageMat = new THREE.MeshStandardMaterial({
        color: 0x27866d,
        roughness: 0.85,
        metalness: 0.04,
      });
      materials.push(foliageMat);
      const treeInst = new THREE.InstancedMesh(foliageGeo, foliageMat, treePositions.length);
      treePositions.forEach(([tx, tz], idx) => {
        const s = 0.85 + (idx % 3) * 0.15;
        _dummyObj.position.set(tx, 0, tz);
        _dummyObj.scale.set(s, s, s);
        _dummyObj.rotation.set(0, idx * 0.7, 0);
        _dummyObj.updateMatrix();
        treeInst.setMatrixAt(idx, _dummyObj.matrix);
        treeInst.setColorAt(
          idx,
          new THREE.Color(idx % 2 === 0 ? 0x27866d : 0x2f9b7e)
        );
      });
      treeInst.instanceMatrix.needsUpdate = true;
      if (treeInst.instanceColor) treeInst.instanceColor.needsUpdate = true;
      treeInst.computeBoundingSphere();
      campusRoot.add(treeInst);

      if (!isSoftwareGl) {
        renderer.compile(scene, camera);
      }

      // Raycasting for Hover & Click
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      let lastMoveTime = 0;

      const updatePointer = (ev: PointerEvent) => {
        const rect = renderer!.domElement.getBoundingClientRect();
        pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      };

      const onPointerMove = (ev: PointerEvent) => {
        const now = performance.now();
        if (now - lastMoveTime < 45) return;
        lastMoveTime = now;
        updatePointer(ev);
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(clickTargets, false);
        if (hits.length > 0) {
          const id = String(hits[0].object.userData.buildingId || '');
          setHoveredId(id || null);
          renderer!.domElement.style.cursor = 'pointer';
        } else {
          setHoveredId(null);
          renderer!.domElement.style.cursor = 'grab';
        }
      };

      let downX = 0;
      let downY = 0;
      const onPointerDown = (ev: PointerEvent) => {
        downX = ev.clientX;
        downY = ev.clientY;
      };
      const onPointerUp = (ev: PointerEvent) => {
        const dist = Math.hypot(ev.clientX - downX, ev.clientY - downY);
        if (dist > 6) return; // user orbited rather than clicked
        updatePointer(ev);
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(clickTargets, false);
        if (hits.length > 0) {
          const id = String(hits[0].object.userData.buildingId || '');
          if (id) onSelectRef.current?.(id);
        }
      };

      renderer.domElement.addEventListener('pointermove', onPointerMove);
      renderer.domElement.addEventListener('pointerdown', onPointerDown);
      renderer.domElement.addEventListener('pointerup', onPointerUp);

      const onContextLost = (e: Event) => {
        e.preventDefault();
        setWebglUnavailable(true);
      };
      renderer.domElement.addEventListener('webglcontextlost', onContextLost);

      const handleResize = () => {
        if (!container || !renderer) return;
        const w = container.clientWidth || 640;
        const h = container.clientHeight || 340;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);

      const clock = new THREE.Clock();

      function afterDraw(cb: () => void) {
        if (!renderer || disposed) return;
        const gl = renderer.getContext() as WebGL2RenderingContext;
        if (!gl?.fenceSync) {
          frameId = window.setTimeout(cb, 80);
          return;
        }
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      }

      const tick = () => {
        if (disposed || !renderer || !controls) return;
        const delta = Math.min(clock.getDelta(), 0.1);
        const elapsed = clock.getElapsedTime();

        // Sync light/dark theme colors smoothly
        const isDark = themeRef.current === 'dark';
        const targetBg = isDark ? 0x16141c : 0xf6f3f6;
        (scene.background as THREE.Color).setHex(targetBg);
        if (scene.fog instanceof THREE.FogExp2) {
          scene.fog.color.setHex(targetBg);
        }
        groundMat.color.setHex(isDark ? 0x1d1a24 : 0xefeaf0);

        // Update building highlight state
        const currentSelected = activeBuildingRef.current;
        buildingRefs.forEach((refs, id) => {
          const selected = id === currentSelected;
          refs.shellMat.color.setHex(
            selected ? (isDark ? 0x2b2434 : 0x19171d) : isDark ? 0x353040 : 0xffffff
          );
          refs.ringMesh.visible = selected;
          if (!prefersReducedMotion) {
            refs.beaconMesh.position.y = refs.baseY + Math.sin(elapsed * 2.4 + refs.baseY) * 0.08;
            refs.beaconMesh.rotation.y = elapsed * (selected ? 1.8 : 0.7);
          }
        });

        // Animate data packets along curved neural pathways
        if (!prefersReducedMotion) {
          let idx = 0;
          for (let cIdx = 0; cIdx < curves.length; cIdx++) {
            const curve = curves[cIdx];
            for (let p = 0; p < 3; p++) {
              const t = (elapsed * 0.22 + cIdx * 0.19 + p * 0.33) % 1;
              curve.getPointAt(t, _v1);
              _dummyObj.position.copy(_v1);
              _dummyObj.scale.setScalar(1);
              _dummyObj.rotation.set(0, 0, 0);
              _dummyObj.updateMatrix();
              packetInstances.setMatrixAt(idx, _dummyObj.matrix);
              idx++;
            }
          }
          packetInstances.instanceMatrix.needsUpdate = true;
        }

        // Smooth camera transition to selected building
        if (cameraTransitioningRef.current && !prefersReducedMotion) {
          camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetCamPos.x, 3.6, delta);
          camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetCamPos.y, 3.6, delta);
          camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetCamPos.z, 3.6, delta);
          controls.target.x = THREE.MathUtils.damp(controls.target.x, _targetLookAt.x, 4.2, delta);
          controls.target.y = THREE.MathUtils.damp(controls.target.y, _targetLookAt.y, 4.2, delta);
          controls.target.z = THREE.MathUtils.damp(controls.target.z, _targetLookAt.z, 4.2, delta);

          if (_v2.copy(camera.position).distanceTo(_targetCamPos) < 0.06) {
            cameraTransitioningRef.current = false;
          }
        } else if (!prefersReducedMotion) {
          campusRoot.rotation.y = Math.sin(elapsed * 0.16) * 0.14;
        }

        controls.update();
        renderer.render(scene, camera);

        if (!prefersReducedMotion) {
          if (isSoftwareGl) afterDraw(tick);
          else frameId = requestAnimationFrame(tick);
        }
      };

      tick();

      return () => {
        disposed = true;
        resizeObserver.disconnect();
        cancelAnimationFrame(frameId);
        clearTimeout(frameId);
        renderer?.domElement.removeEventListener('pointermove', onPointerMove);
        renderer?.domElement.removeEventListener('pointerdown', onPointerDown);
        renderer?.domElement.removeEventListener('pointerup', onPointerUp);
        renderer?.domElement.removeEventListener('webglcontextlost', onContextLost);
        controls?.dispose();
        geometries.forEach((g) => g.dispose());
        materials.forEach((m) => m.dispose());
        textures.forEach((t) => t.dispose());
        renderer?.dispose();
      };
    } catch {
      setWebglUnavailable(true);
      return undefined;
    }
  }, []);

  const displayedBuilding =
    CAMPUS_BUILDINGS.find((b) => b.id === (hoveredId || activeBuilding)) || CAMPUS_BUILDINGS[1];

  if (webglUnavailable) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#F8F6F7] dark:bg-[#1C1922] rounded-xl border border-[#E8E4E9] dark:border-[#342E3D] p-6 text-center">
        <div className="grid grid-cols-5 gap-2 mb-3">
          {CAMPUS_BUILDINGS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelectBuilding?.(b.id)}
              className={`px-3 py-2 rounded-lg border text-xs font-mono-num font-semibold transition-colors cursor-pointer ${
                activeBuilding === b.id
                  ? 'bg-[#E84D96] text-white border-[#E84D96]'
                  : 'bg-white dark:bg-[#26222E] border-[#E8E4E9] dark:border-[#383242] text-[#19171D] dark:text-white hover:border-[#E84D96]'
              }`}
            >
              {b.code}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#77727D] dark:text-[#A39CA9]">
          2D Interactive Campus Topology Fallback Active
        </p>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${heightClass} rounded-xl overflow-hidden select-none`}>
      <div
        ref={mountRef}
        className="w-full h-full"
        aria-label="Interactive 3D Smart Campus Architectural Model"
      />

      {showHudOverlay && (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex flex-wrap items-center justify-between gap-2">
          <div className="pointer-events-auto px-3 py-2 rounded-lg bg-[#19171D]/88 text-white border border-white/15 text-xs flex items-center gap-3 shadow-md">
            <span className="font-mono-num font-bold text-[#FF70B5]">
              {displayedBuilding.code}
            </span>
            <span className="font-medium truncate max-w-[180px] sm:max-w-none">
              {displayedBuilding.name}
            </span>
            <span className="hidden sm:inline text-white/65 font-mono-num">
              {displayedBuilding.occupancyPct}% occ · {displayedBuilding.elevators} lifts
            </span>
          </div>
          <span className="hidden sm:inline-block px-2.5 py-1.5 rounded-lg bg-[#19171D]/82 text-white/80 border border-white/10 text-[11px]">
            Drag to orbit · Scroll to zoom · Click building
          </span>
        </div>
      )}
    </div>
  );
}
