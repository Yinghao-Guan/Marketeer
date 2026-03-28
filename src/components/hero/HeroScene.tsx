"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment } from "@react-three/drei";
import type { Mesh } from "three";

function CampaignShape() {
  const meshRef = useRef<Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.004;
      meshRef.current.rotation.z += 0.001;
    }
  });

  return (
    <Float floatIntensity={1.2} speed={1.5} rotationIntensity={0.2}>
      <mesh ref={meshRef} scale={1}>
        <torusKnotGeometry args={[1.6, 0.5, 256, 32]} />
        <meshPhysicalMaterial
          color="#0a1628"
          metalness={1}
          roughness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.03}
          envMapIntensity={1.5}
        />
      </mesh>
    </Float>
  );
}

export default function HeroScene() {
  return (
    <div className="w-full max-w-[520px] aspect-[520/340]">
      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, 5.5], fov: 45 }}
      >
        <ambientLight intensity={0.15} />
        <spotLight
          position={[6, 6, 4]}
          color="#c8a820"
          intensity={40}
          angle={0.5}
          penumbra={0.8}
        />
        <pointLight position={[-4, -2, -3]} color="#3a7bd5" intensity={8} />
        <pointLight position={[0, 4, -2]} color="#c8a820" intensity={5} />

        <CampaignShape />

        <Environment preset="city" environmentIntensity={0.8} />
      </Canvas>
    </div>
  );
}
