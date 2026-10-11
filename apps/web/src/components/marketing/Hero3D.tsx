'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export function Hero3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    // Check WebGL availability
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
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Group for layered code review workspace
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Central Abstract Review Core (Geometric Icosahedron)
    const coreGeometry = new THREE.IcosahedronGeometry(1.8, 1);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x6366f1, // Indigo
      wireframe: true,
      emissive: 0x4f46e5,
      emissiveIntensity: 0.4,
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    mainGroup.add(coreMesh);

    // Inner glowing sphere
    const innerGeo = new THREE.SphereGeometry(1.0, 16, 16);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4, // Cyan
      wireframe: true,
    });
    const innerSphere = new THREE.Mesh(innerGeo, innerMat);
    mainGroup.add(innerSphere);

    // 2. Layered Floating Code Panels (Planes)
    const panelGeo = new THREE.PlaneGeometry(3.5, 2.2);
    const panelMaterial1 = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const panel1 = new THREE.Mesh(panelGeo, panelMaterial1);
    panel1.position.set(-2.8, 1.2, -1);
    panel1.rotation.set(0.1, 0.35, -0.05);
    mainGroup.add(panel1);

    const panelMaterial2 = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const panel2 = new THREE.Mesh(panelGeo, panelMaterial2);
    panel2.position.set(2.8, -1.0, 1);
    panel2.rotation.set(-0.1, -0.3, 0.05);
    mainGroup.add(panel2);

    // 3. Floating Review Finding Nodes (Glowing Particles/Spheres)
    const nodeGeometry = new THREE.SphereGeometry(0.14, 12, 12);
    const nodeMaterialCritical = new THREE.MeshBasicMaterial({ color: 0xef4444 }); // Red
    const nodeMaterialSafe = new THREE.MeshBasicMaterial({ color: 0x10b981 }); // Green
    const nodeMaterialCyan = new THREE.MeshBasicMaterial({ color: 0x06b6d4 }); // Cyan

    const node1 = new THREE.Mesh(nodeGeometry, nodeMaterialCritical);
    node1.position.set(-1.8, 2.1, 0.8);
    mainGroup.add(node1);

    const node2 = new THREE.Mesh(nodeGeometry, nodeMaterialSafe);
    node2.position.set(2.2, 1.6, -0.5);
    mainGroup.add(node2);

    const node3 = new THREE.Mesh(nodeGeometry, nodeMaterialCyan);
    node3.position.set(0.8, -2.4, 0.6);
    mainGroup.add(node3);

    // 4. Subtle Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x818cf8, 2.5, 50);
    pointLight.position.set(5, 5, 8);
    scene.add(pointLight);

    const cyanPointLight = new THREE.PointLight(0x06b6d4, 2.0, 40);
    cyanPointLight.position.set(-5, -4, 5);
    scene.add(cyanPointLight);

    // Pointer Parallax Movement
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth parallax interpolation
      targetX += (mouseX * 0.4 - targetX) * 0.05;
      targetY += (mouseY * 0.4 - targetY) * 0.05;

      mainGroup.rotation.y = elapsedTime * 0.15 + targetX;
      mainGroup.rotation.x = Math.sin(elapsedTime * 0.2) * 0.1 + targetY;

      // Inner core counter-rotation
      coreMesh.rotation.y = elapsedTime * 0.25;
      coreMesh.rotation.z = elapsedTime * 0.15;
      innerSphere.rotation.y = -elapsedTime * 0.35;

      // Subtle bobbing of panels
      panel1.position.y = 1.2 + Math.sin(elapsedTime * 0.8) * 0.15;
      panel2.position.y = -1.0 + Math.cos(elapsedTime * 0.8) * 0.15;

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[420px] md:h-[520px] flex items-center justify-center">
      {hasWebGL ? (
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      ) : (
        // WebGL Fallback: Layered Glass Architectural Mockup
        <div className="w-full h-full flex items-center justify-center p-6">
          <div className="relative w-80 h-64 glass-panel rounded-2xl p-6 border border-brand-500/30 shadow-glow flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400">DIFF_ANALYZER_CORE</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-2 w-3/4 bg-slate-700/60 rounded" />
              <div className="h-2 w-1/2 bg-brand-500/40 rounded" />
              <div className="h-2 w-5/6 bg-slate-700/60 rounded" />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-mono">1 CRITICAL</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">VERIFIED</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
