"use client";

import React, { useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Html, Stars, Grid } from "@react-three/drei";
import * as THREE from "three";
import { SentinelNode } from "@/lib/services/facility/sentinel/sentinelEngine";

// --- Assets ---

/**
 * A futuristic looking server/chiller unit.
 */
function MachineUnit({
  position,
  node,
  onClick,
}: {
  position: [number, number, number];
  node?: SentinelNode;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);

  // Status Colors
  const statusColor = useMemo(() => {
    if (!node) return "#4b5563"; // Gray default
    switch (node.status) {
      case "OPERATIONAL":
        return "#10b981"; // Green
      case "WARNING":
        return "#f59e0b"; // Amber
      case "CRITICAL":
      case "FAILED":
        return "#ef4444"; // Red
      default:
        return "#4b5563";
    }
  }, [node?.status]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Subtle pulse for active units
      if (node?.status === "OPERATIONAL") {
        meshRef.current.rotation.y += delta * 0.2;
      } else if (node?.status === "FAILED") {
        // Shake effect for failed
        meshRef.current.position.x =
          position[0] + Math.sin(state.clock.elapsedTime * 20) * 0.05;
      }
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <boxGeometry args={[1.5, 2, 1.5]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={
            node?.status === "FAILED" ? 2 : hovered ? 0.8 : 0.2
          }
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Label Overlay - Always Face Camera */}
      <Html position={[0, 2.5, 0]} center distanceFactor={15}>
        <div
          className={`
            px-2 py-1 rounded text-xs font-bold border whitespace-nowrap backdrop-blur-md
            ${node?.status === "FAILED" ? "bg-red-900/80 border-red-500 text-red-100" : "bg-gray-900/80 border-cyan-500 text-cyan-100"}
        `}
        >
          {node?.label || "Unknown Unit"}
          {hovered && (
            <div className="text-[10px] font-normal opacity-80">
              Click to Inspect
            </div>
          )}
        </div>
      </Html>

      {/* Simulated Floor Reflection/Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.01, 0]}>
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial color={statusColor} transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

/**
 * Procedural Racking System for Context
 */
function WarehouseRacking({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      {/* Uprights */}
      <mesh position={[-2, 1.5, 0]}>
        <boxGeometry args={[0.2, 3, 0.2]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[2, 1.5, 0]}>
        <boxGeometry args={[0.2, 3, 0.2]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* Shelves */}
      {[0.5, 1.5, 2.5].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <boxGeometry args={[4.2, 0.1, 1]} />
          <meshStandardMaterial color="#444" />
        </mesh>
      ))}
      {/* Pallets (Decor) */}
      <mesh position={[-1, 1.8, 0]}>
        <boxGeometry args={[0.8, 0.6, 0.8]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[1, 0.8, 0]}>
        <boxGeometry args={[0.8, 0.6, 0.8]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[0, 2.8, 0]}>
        <boxGeometry args={[0.8, 0.6, 0.8]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
    </group>
  );
}

interface Facility3DSceneProps {
  nodes: SentinelNode[];
  onNodeClick: (nodeId: string) => void;
}

export default function Facility3DScene({
  nodes,
  onNodeClick,
}: Facility3DSceneProps) {
  // Helper to find node by simple string matching or ID mapping
  // We map the 3D mock infrastructure to the IDs we defined in `sentinelEngine`
  // Mock Layout Mapping:
  // - [-5, 0, 0] -> Chiller A (ID: 3)
  // - [0, 0, -5] -> Main Power (ID: 1)
  // - [5, 0, 0] -> Chiller B (ID: 4)
  // - [0, 0, 0] -> Zone (ID: 5)
  // - [0, 0, 5] -> Vent (ID: 8)

  const findNode = (targetId: string) => nodes.find((n) => n.id === targetId);

  return (
    <div className="w-full h-full bg-black rounded-xl overflow-hidden shadow-inner border border-gray-800">
      <Canvas shadows camera={{ position: [10, 10, 10], fov: 50 }}>
        <fog attach="fog" args={["#050510", 10, 50]} />
        <OrbitControls
          autoRotate
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 2.1}
        />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#00ffff" />
        <pointLight position={[-10, 5, -10]} intensity={0.5} color="#ff00ff" />

        <Stars
          radius={100}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />

        <Grid
          args={[50, 50]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#1f2937"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#374151"
          fadeDistance={30}
        />

        {/* --- Infrastructure Units --- */}

        {/* Main Power Grid */}
        <MachineUnit
          position={[0, 1, -8]}
          node={findNode("1")}
          onClick={() => onNodeClick("1")}
        />

        {/* Chiller A */}
        <MachineUnit
          position={[-6, 1, -2]}
          node={findNode("3")}
          onClick={() => onNodeClick("3")}
        />

        {/* Chiller B */}
        <MachineUnit
          position={[6, 1, -2]}
          node={findNode("4")}
          onClick={() => onNodeClick("4")}
        />

        {/* Ventilation */}
        <MachineUnit
          position={[0, 1, 5]}
          node={findNode("8")}
          onClick={() => onNodeClick("8")}
        />

        {/* --- Context Environment (Racking) --- */}
        <WarehouseRacking position={[-6, 0, 5]} />
        <WarehouseRacking position={[6, 0, 5]} />
        <WarehouseRacking position={[-10, 0, 0]} />
        <WarehouseRacking position={[10, 0, 0]} />

        {/* --- Floor --- */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial
            color="#050510"
            roughness={0.1}
            metalness={0.5}
          />
        </mesh>
      </Canvas>
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <div className="bg-black/50 backdrop-blur px-3 py-1 rounded border border-white/10 text-xs text-gray-400">
          Left Click + Drag to Rotate • Scroll to Zoom
        </div>
      </div>
    </div>
  );
}
