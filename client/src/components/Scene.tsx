import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ScrollControls, useScroll, Environment, Float } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function AbstractShape({ position, rotation, scale, color, speed }: any) {
  const mesh = useRef<THREE.Mesh>(null);
  const scroll = useScroll();
  
  useFrame((state, delta) => {
    if (!mesh.current) return;
    
    // Rotate constantly
    mesh.current.rotation.x += delta * 0.2;
    mesh.current.rotation.y += delta * 0.1;

    // Move based on scroll
    // The scroll.offset is 0 at top, 1 at bottom
    const yOffset = scroll.offset * 10; 
    mesh.current.position.y = position[1] + yOffset * speed;
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={mesh} position={position} rotation={rotation} scale={scale}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.1} 
          metalness={0.1}
          transparent
          opacity={0.8}
        />
      </mesh>
    </Float>
  );
}

function Composition() {
  const { width, height } = useThree((state) => state.viewport);
  
  return (
    <group>
      <AbstractShape position={[-width/3, 0, -2]} rotation={[0, 0.5, 0]} scale={[1.5, 4, 0.2]} color="#dcbfa6" speed={1} />
      <AbstractShape position={[width/2.5, -3, -1]} rotation={[0.5, 0, 0]} scale={[2, 2, 2]} color="#a68a6d" speed={1.5} />
      <AbstractShape position={[0, -8, -3]} rotation={[0, 0, 0.2]} scale={[1, 6, 1]} color="#e6d5c3" speed={2} />
      <AbstractShape position={[-width/4, -12, -1]} rotation={[0.2, 0.2, 0]} scale={[1.5, 1.5, 1.5]} color="#8c735a" speed={1.2} />
      <AbstractShape position={[width/3, -15, -2]} rotation={[0, 0.5, 0]} scale={[3, 0.2, 3]} color="#c2a78e" speed={1.8} />
    </group>
  );
}

export function Scene() {
  return (
    <div className="canvas-container">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        {/* Pages needs to match roughly the scroll height of the HTML content */}
        <ScrollControls pages={5} damping={0.3}>
          <Composition />
        </ScrollControls>
        
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
