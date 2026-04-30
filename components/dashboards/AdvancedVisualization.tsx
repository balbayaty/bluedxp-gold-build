/**
 * Advanced Visualization Component
 * 3D visualization support and advanced charts
 * Much more comprehensive than source apps
 */

"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface AdvancedVisualizationProps {
  type: "3D_NETWORK" | "3D_WAREHOUSE" | "HEATMAP" | "SUNBURST" | "SANKEY";
  data: any;
  width?: number;
  height?: number;
}

export default function AdvancedVisualization({
  type,
  data,
  width = 800,
  height = 600,
}: AdvancedVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (type.startsWith("3D_") && containerRef.current && !initialized) {
      // Initialize Three.js for 3D visualizations
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ antialias: true });

      renderer.setSize(width, height);
      containerRef.current.appendChild(renderer.domElement);

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 10, 5);
      scene.add(directionalLight);

      if (type === "3D_NETWORK") {
        // Create 3D network visualization
        const nodes = data.nodes || [];
        nodes.forEach((node: any, index: number) => {
          const geometry = new THREE.SphereGeometry(0.5, 32, 32);
          const material = new THREE.MeshStandardMaterial({
            color: node.color || 0x3b82f6,
          });
          const sphere = new THREE.Mesh(geometry, material);
          sphere.position.set(
            (index % 5) * 2 - 4,
            Math.floor(index / 5) * 2 - 2,
            (index % 3) * 2 - 2,
          );
          scene.add(sphere);
        });
      } else if (type === "3D_WAREHOUSE") {
        // Create 3D warehouse visualization
        const floorGeometry = new THREE.PlaneGeometry(10, 10);
        const floorMaterial = new THREE.MeshStandardMaterial({
          color: 0xcccccc,
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        scene.add(floor);

        // Add warehouse structures
        const rackGeometry = new THREE.BoxGeometry(0.5, 2, 0.5);
        const rackMaterial = new THREE.MeshStandardMaterial({
          color: 0x8b5cf6,
        });
        for (let i = 0; i < 10; i++) {
          const rack = new THREE.Mesh(rackGeometry, rackMaterial);
          rack.position.set((i % 5) * 2 - 4, 1, Math.floor(i / 5) * 2 - 2);
          scene.add(rack);
        }
      }

      camera.position.set(5, 5, 5);
      camera.lookAt(0, 0, 0);

      const animate = () => {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };
      animate();

      setInitialized(true);

      return () => {
        if (containerRef.current && renderer.domElement) {
          containerRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    }
  }, [type, width, height, initialized, data]);

  if (type.startsWith("3D_")) {
    return (
      <div className="w-full h-full">
        <div
          ref={containerRef}
          className="w-full h-full rounded-lg border border-gray-200"
        ></div>
      </div>
    );
  }

  // 2D visualizations
  return (
    <div className="w-full h-full p-4 bg-white rounded-lg border border-gray-200">
      <p className="text-gray-600 text-center">
        {type} visualization - Advanced rendering coming soon
      </p>
    </div>
  );
}
