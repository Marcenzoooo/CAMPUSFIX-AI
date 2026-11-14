import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { NovaAvatar, type NovaState } from './NovaAvatar';

interface Nova3DCanvasProps {
  state?: NovaState;
  className?: string;
}

function isSoftwareWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const p = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const str = String(gl.getParameter(p) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(str);
  } catch {
    return true;
  }
}

export function Nova3DCanvas({ state = 'idle', className = 'w-28 h-28' }: Nova3DCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<NovaState>(state);
  const pointerTargetRef = useRef({ x: 0, y: 0 });
  const [fallback2d, setFallback2d] = useState(false);

  stateRef.current = state;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setFallback2d(true);
      return;
    }

    const softwareGl = isSoftwareWebGL();
    let renderer: THREE.WebGLRenderer | null = null;
    let frameId = 0;
    let disposed = false;

    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];

    try {
      const width = container.clientWidth || 120;
      const height = container.clientHeight || 120;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 30);
      camera.position.set(0, 0.25, 4.1);

      renderer = new THREE.WebGLRenderer({
        antialias: !softwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      renderer.setPixelRatio(softwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);

      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
      scene.environment = envRT.texture;
      textures.push(envRT.texture);
      pmrem.dispose();

      // Three-point lighting
      const hemi = new THREE.HemisphereLight(0xf3f6ff, 0x26202b, 0.85);
      scene.add(hemi);
      const key = new THREE.DirectionalLight(0xfff6f2, 1.35);
      key.position.set(2.5, 4, 3.5);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xe84d96, 0.8);
      rim.position.set(-3, 2, -2.5);
      scene.add(rim);

      // Composite 10-Part 3D Nova Companion Group
      const novaGroup = new THREE.Group();
      scene.add(novaGroup);

      const headGroup = new THREE.Group();
      headGroup.position.y = 0.24;
      novaGroup.add(headGroup);

      const ceramicMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.24,
        metalness: 0.06,
        clearcoat: 0.85,
        clearcoatRoughness: 0.15,
      });
      const obsidianMat = new THREE.MeshPhysicalMaterial({
        color: 0x19171d,
        roughness: 0.18,
        metalness: 0.35,
        clearcoat: 1.0,
      });
      const charcoalMat = new THREE.MeshStandardMaterial({
        color: 0x302b35,
        roughness: 0.52,
        metalness: 0.45,
      });
      const eyeMat = new THREE.MeshStandardMaterial({
        color: 0xe84d96,
        emissive: 0xe84d96,
        emissiveIntensity: 1.4,
        roughness: 0.15,
      });
      const haloMat = new THREE.MeshStandardMaterial({
        color: 0xe84d96,
        emissive: 0xe84d96,
        emissiveIntensity: 0.9,
        roughness: 0.25,
        metalness: 0.6,
        transparent: true,
        opacity: 0.75,
      });
      materials.push(ceramicMat, obsidianMat, charcoalMat, eyeMat, haloMat);

      // 1. Ceramic Head Shell
      const headGeo = new THREE.BoxGeometry(1.22, 0.96, 0.92);
      geometries.push(headGeo);
      const headShell = new THREE.Mesh(headGeo, ceramicMat);
      headGroup.add(headShell);

      // 2. Crown Crest Trim
      const crownGeo = new THREE.BoxGeometry(0.92, 0.1, 0.72);
      geometries.push(crownGeo);
      const crown = new THREE.Mesh(crownGeo, charcoalMat);
      crown.position.y = 0.51;
      headGroup.add(crown);

      // 3. Neural Antenna Stem & Tip
      const stemGeo = new THREE.CylinderGeometry(0.03, 0.035, 0.24, 12);
      geometries.push(stemGeo);
      const stem = new THREE.Mesh(stemGeo, charcoalMat);
      stem.position.y = 0.65;
      headGroup.add(stem);

      const tipGeo = new THREE.SphereGeometry(0.08, 16, 16);
      geometries.push(tipGeo);
      const tip = new THREE.Mesh(tipGeo, eyeMat);
      tip.position.y = 0.8;
      headGroup.add(tip);

      // 4. Midnight Visor Glass
      const visorGeo = new THREE.BoxGeometry(0.98, 0.62, 0.12);
      geometries.push(visorGeo);
      const visor = new THREE.Mesh(visorGeo, obsidianMat);
      visor.position.set(0, -0.02, 0.44);
      headGroup.add(visor);

      // 5 & 6. Acoustic Ear Pods (Left & Right)
      const podGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.16, 18);
      podGeo.rotateZ(Math.PI / 2);
      geometries.push(podGeo);
      const podLeft = new THREE.Mesh(podGeo, charcoalMat);
      podLeft.position.set(-0.67, 0, 0);
      headGroup.add(podLeft);
      const podRight = new THREE.Mesh(podGeo, charcoalMat);
      podRight.position.set(0.67, 0, 0);
      headGroup.add(podRight);

      // 7 & 8. Expressive Optical Eyes
      const eyeGeo = new THREE.CapsuleGeometry(0.075, 0.1, 6, 12);
      geometries.push(eyeGeo);
      const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
      leftEye.position.set(-0.22, 0.04, 0.51);
      headGroup.add(leftEye);
      const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
      rightEye.position.set(0.22, 0.04, 0.51);
      headGroup.add(rightEye);

      // 9. Voice Waveform Bars (3 capsules)
      const waveGeo = new THREE.CapsuleGeometry(0.025, 0.09, 4, 8);
      geometries.push(waveGeo);
      const waveBars: THREE.Mesh[] = [];
      for (let i = -1; i <= 1; i++) {
        const bar = new THREE.Mesh(waveGeo, eyeMat);
        bar.position.set(i * 0.1, -0.17, 0.51);
        headGroup.add(bar);
        waveBars.push(bar);
      }

      // 10. Collar & Floating Torso Base
      const collarGeo = new THREE.CylinderGeometry(0.26, 0.34, 0.16, 20);
      geometries.push(collarGeo);
      const collar = new THREE.Mesh(collarGeo, obsidianMat);
      collar.position.y = -0.36;
      novaGroup.add(collar);

      const torsoGeo = new THREE.CylinderGeometry(0.46, 0.24, 0.46, 24);
      geometries.push(torsoGeo);
      const torso = new THREE.Mesh(torsoGeo, ceramicMat);
      torso.position.y = -0.66;
      novaGroup.add(torso);

      // 11. Orbital Thinking Halo Ring
      const haloGeo = new THREE.TorusGeometry(0.95, 0.025, 10, 48);
      haloGeo.rotateX(Math.PI / 2.2);
      geometries.push(haloGeo);
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.y = 0.24;
      novaGroup.add(halo);

      const onPointerMove = (e: PointerEvent) => {
        const rect = container.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        pointerTargetRef.current.x = THREE.MathUtils.clamp(nx, -1, 1);
        pointerTargetRef.current.y = THREE.MathUtils.clamp(ny, -1, 1);
      };
      window.addEventListener('pointermove', onPointerMove);

      const onContextLost = (e: Event) => {
        e.preventDefault();
        setFallback2d(true);
      };
      renderer.domElement.addEventListener('webglcontextlost', onContextLost);

      const resizeObserver = new ResizeObserver(() => {
        if (!container || !renderer) return;
        const w = container.clientWidth || 120;
        const h = container.clientHeight || 120;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      });
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
          const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (status === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      }

      const tick = () => {
        if (disposed || !renderer) return;
        const delta = Math.min(clock.getDelta(), 0.1);
        const t = clock.getElapsedTime();
        const current = stateRef.current;

        // Gentle levitation
        novaGroup.position.y = Math.sin(t * 2.2) * 0.08;

        // Smooth pointer head tracking
        const targetYaw = pointerTargetRef.current.x * 0.28;
        const targetPitch = pointerTargetRef.current.y * 0.14;
        headGroup.rotation.y = THREE.MathUtils.damp(headGroup.rotation.y, targetYaw, 5, delta);
        headGroup.rotation.x = THREE.MathUtils.damp(headGroup.rotation.x, targetPitch, 5, delta);

        // Periodic blinking
        const blinkPhase = t % 4.8;
        const eyeScaleY = blinkPhase > 4.55 && blinkPhase < 4.72 ? 0.15 : 1;
        leftEye.scale.y = eyeScaleY;
        rightEye.scale.y = eyeScaleY;

        // State-driven expression
        if (current === 'thinking') {
          halo.visible = true;
          halo.rotation.z = t * 2.6;
          halo.rotation.y = t * 1.4;
          eyeMat.emissiveIntensity = 1.6 + Math.sin(t * 8) * 0.45;
          waveBars.forEach((b, idx) => {
            b.scale.y = 0.55 + Math.sin(t * 7 + idx * 1.1) * 0.35;
          });
        } else if (current === 'responding') {
          halo.visible = true;
          halo.rotation.z = t * 1.1;
          eyeMat.emissiveIntensity = 1.4;
          waveBars.forEach((b, idx) => {
            b.scale.y = 0.65 + Math.abs(Math.sin(t * 11 + idx * 1.3)) * 1.15;
          });
        } else {
          halo.visible = false;
          eyeMat.emissiveIntensity = 1.15;
          waveBars.forEach((b) => {
            b.scale.y = 0.45;
          });
        }

        renderer.render(scene, camera);

        if (softwareGl) afterDraw(tick);
        else frameId = requestAnimationFrame(tick);
      };

      tick();

      return () => {
        disposed = true;
        resizeObserver.disconnect();
        window.removeEventListener('pointermove', onPointerMove);
        renderer?.domElement.removeEventListener('webglcontextlost', onContextLost);
        cancelAnimationFrame(frameId);
        clearTimeout(frameId);
        geometries.forEach((g) => g.dispose());
        materials.forEach((m) => m.dispose());
        textures.forEach((tx) => tx.dispose());
        renderer?.dispose();
      };
    } catch {
      setFallback2d(true);
      return undefined;
    }
  }, []);

  if (fallback2d) {
    return <NovaAvatar state={state} size="lg" className={className} />;
  }

  return (
    <div
      ref={mountRef}
      className={`relative select-none ${className}`}
      aria-label={`Nova 3D AI Companion (${state})`}
    />
  );
}
