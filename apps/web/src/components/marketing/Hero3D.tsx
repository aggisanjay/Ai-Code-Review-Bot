'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export function Hero3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setHasWebGL(false);
        return;
      }
    } catch {
      setHasWebGL(false);
      return;
    }

    const container = containerRef.current;
    const width = container.clientWidth || 550;
    const height = container.clientHeight || 480;

    // Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0, 13);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // 1. Deep Slate / Forest Emerald Faceted Monolith
    const coreGeo = new THREE.OctahedronGeometry(2.1, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x14211D,
      roughness: 0.28,
      metalness: 0.85,
      flatShading: true,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    rootGroup.add(coreMesh);

    // Wireframe overlay for architectural telemetry
    const wireframeGeo = new THREE.WireframeGeometry(coreGeo);
    const wireframeMat = new THREE.LineBasicMaterial({
      color: 0x126B50,
      transparent: true,
      opacity: 0.55,
    });
    const wireframe = new THREE.LineSegments(wireframeGeo, wireframeMat);
    coreMesh.add(wireframe);

    // 2. Telemetry Scanner Rings (AST & Diff Scan Layers)
    const scanRings: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const ringGeo = new THREE.RingGeometry(2.8 + i * 0.7, 2.82 + i * 0.7, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i === 0 ? 0x126B50 : i === 1 ? 0x16835B : 0x66736D,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35 - i * 0.08,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2 + (i * 0.2);
      ring.rotation.y = i * 0.4;
      rootGroup.add(ring);
      scanRings.push(ring);
    }

    // 3. Precision Node Points (Commits, AST, Grounding)
    const nodeCoords = [
      { pos: new THREE.Vector3(-3.2, 1.4, 1.2), color: 0x126B50, label: 'COMMIT' },
      { pos: new THREE.Vector3(3.0, -1.2, 0.8), color: 0x16835B, label: 'GROUNDED' },
      { pos: new THREE.Vector3(-1.8, -2.4, -1.0), color: 0xc43d4b, label: 'VULN_RULE' },
      { pos: new THREE.Vector3(2.4, 2.2, -1.2), color: 0xb7791f, label: 'AST_SCAN' },
    ];

    const nodeMeshes: THREE.Mesh[] = [];
    nodeCoords.forEach((item) => {
      // Outer subtle ring
      const ringGeo = new THREE.RingGeometry(0.24, 0.28, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: item.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      });
      const rMesh = new THREE.Mesh(ringGeo, ringMat);
      rMesh.position.copy(item.pos);
      rootGroup.add(rMesh);

      // Inner solid point
      const pGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const pMat = new THREE.MeshBasicMaterial({ color: item.color });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.copy(item.pos);
      rootGroup.add(pMesh);
      nodeMeshes.push(pMesh);

      // Connecting data line back to central core
      const points = [item.pos, new THREE.Vector3(0, 0, 0)];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineDashedMaterial({
        color: item.color,
        dashSize: 0.2,
        gapSize: 0.1,
        transparent: true,
        opacity: 0.35,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      line.computeLineDistances();
      rootGroup.add(line);
    });

    // 4. Subtle Architectural Grid Plane
    const gridHelper = new THREE.GridHelper(10, 20, 0xc7e4d6, 0xe4eae6);
    gridHelper.position.y = -3.2;
    rootGroup.add(gridHelper);

    // 5. Precision Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const topKeyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    topKeyLight.position.set(6, 10, 8);
    scene.add(topKeyLight);

    const rimEmeraldLight = new THREE.PointLight(0x126b50, 3.5, 30);
    rimEmeraldLight.position.set(-6, 2, 4);
    scene.add(rimEmeraldLight);

    const softFillLight = new THREE.PointLight(0x16835b, 2.0, 20);
    softFillLight.position.set(6, -4, 2);
    scene.add(softFillLight);

    // Mouse Tracking with Damped Inertia
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    window.addEventListener('mousemove', onMouseMove);

    // Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Smooth inertia
      targetX += (mouseX * 0.35 - targetX) * 0.05;
      targetY += (mouseY * 0.35 - targetY) * 0.05;

      rootGroup.rotation.y = time * 0.08 + targetX;
      rootGroup.rotation.x = Math.sin(time * 0.15) * 0.06 + targetY;

      // Pulse scan rings
      scanRings.forEach((ring, idx) => {
        ring.rotation.z = time * (0.05 * (idx % 2 === 0 ? 1 : -1));
      });

      // Core faceted rotation
      coreMesh.rotation.y = time * 0.12;
      coreMesh.rotation.x = Math.sin(time * 0.2) * 0.1;

      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[400px] md:h-[480px] flex items-center justify-center">
      {hasWebGL ? (
        <>
          <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing select-none" />
          
          {/* Subtle Telemetry Overlay Tags */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 font-mono text-[11px] text-[#F3F7F5] bg-[#04070A]/95 border border-[rgba(255,255,255,0.09)] px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-sleek-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16835B] animate-pulse" />
            <span className="font-semibold">AST_PARSER: ACTIVE</span>
            <span className="text-[#C7E4D6]">|</span>
            <span className="text-[#9AA7A1]">DIFF_DEPTH: 48 FILES</span>
          </div>

          <div className="absolute top-4 right-4 font-mono text-[11px] text-[#F3F7F5] bg-[#04070A]/95 border border-[rgba(255,255,255,0.09)] px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-sleek-md">
            <span className="text-[#9AA7A1]">GROUNDING: </span>
            <span className="text-[#34E5A5] font-semibold">ZERO-HALLUCINATION</span>
          </div>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center p-6">
          <div className="w-80 bg-[#0A1115] rounded-2xl p-6 border border-[rgba(255,255,255,0.09)] shadow-sleek-md">
            <div className="flex items-center justify-between text-xs font-mono text-[#9AA7A1] mb-4">
              <span className="font-semibold text-[#F3F7F5]">SECURITY_MONOLITH</span>
              <span className="text-[#34E5A5]">ONLINE</span>
            </div>
            <div className="space-y-2 text-xs font-mono text-zinc-400">
              <div className="h-2 w-full bg-[rgba(52,229,165,0.10)] rounded" />
              <div className="h-2 w-3/4 bg-[#126B50]/30 rounded" />
              <div className="h-2 w-5/6 bg-[rgba(52,229,165,0.10)] rounded" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
