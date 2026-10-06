import { Canvas, useFrame } from "@react-three/fiber";
import { 
    OrbitControls, 
    Stage, 
    Float, 
    PresentationControls, 
    ContactShadows, 
    Environment, 
    MeshTransmissionMaterial, 
    PerspectiveCamera, 
    SpotLight,
    Float as FloatDrei,
    Sphere,
    Cylinder
} from "@react-three/drei";
import { Suspense, useEffect, useState, useMemo, useRef } from "react";
import * as THREE from "three";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Procedural Petal Geometry
 * Creates an organic, slightly curved petal shape
 */
function Petal({ rotation, position, color, scale = [1, 1, 1] }: any) {
    const shape = useMemo(() => {
        const s = new THREE.Shape();
        s.moveTo(0, 0);
        s.bezierCurveTo(0.2, 0.1, 0.5, 0.5, 0, 1);
        s.bezierCurveTo(-0.5, 0.5, -0.2, 0.1, 0, 0);
        return s;
    }, []);

    const extrudeSettings = { depth: 0.02, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 3 };

    return (
        <group position={position} rotation={rotation} scale={scale}>
            <mesh>
                <extrudeGeometry args={[shape, extrudeSettings]} />
                <MeshTransmissionMaterial 
                    color={color} 
                    roughness={0.15} 
                    thickness={0.2} 
                    anisotropy={0.5} 
                    distortion={0.1}
                    transmission={0.8}
                />
            </mesh>
        </group>
    );
}

/**
 * Premium Rose Component
 * Layered petals in a Fibonacci-like spiral
 */
function Rose({ position, color, scale = 1 }: any) {
    const petals = useMemo(() => {
        const p = [];
        const count = 12;
        for (let i = 0; i < count; i++) {
            const angle = i * 0.5;
            const r = (i / count) * 0.4;
            p.push({
                position: [Math.cos(angle) * r, Math.sin(angle) * r, i * 0.05] as [number, number, number],
                rotation: [0, 0, angle + Math.PI / 2] as [number, number, number],
                scale: [0.5 + r, 0.5 + r, 1] as [number, number, number]
            });
        }
        return p;
    }, []);

    return (
        <group position={position} scale={scale} rotation={[-Math.PI / 2, 0, 0]}>
            <Cylinder args={[0.01, 0.01, 2]} position={[0, 0, -1]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial color="#1b3618" />
            </Cylinder>
            {petals.map((p, i) => (
                <Petal key={i} {...p} color={color} />
            ))}
            <Sphere args={[0.1, 16, 16]} position={[0, 0, 0.1]}>
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
            </Sphere>
        </group>
    );
}

/**
 * Premium Crystal Vase
 * Using LatheGeometry for an elegant profile
 */
function Vase() {
    const points = useMemo(() => {
        const p = [];
        for (let i = 0; i < 10; i++) {
            p.push(new THREE.Vector2(Math.sin(i * 0.3) * 0.3 + 0.3, (i - 5) * 0.2));
        }
        return p;
    }, []);

    return (
        <group position={[0, -0.4, 0]}>
            <mesh>
                <latheGeometry args={[points, 64]} />
                <MeshTransmissionMaterial 
                    backside
                    samples={16}
                    thickness={1}
                    chromaticAberration={0.05}
                    anisotropy={0.1}
                    distortion={0.1}
                    distortionScale={0.3}
                    temporalDistortion={0.1}
                    transmission={1}
                    color="#ffffff"
                />
            </mesh>
            {/* Water level */}
            <mesh position={[0, 0.2, 0]}>
                <cylinderGeometry args={[0.4, 0.4, 0.01, 32]} />
                <meshStandardMaterial color="#aaddff" transparent opacity={0.3} />
            </mesh>
        </group>
    );
}

function Scene({ color }: { color: string }) {
    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 1, 5]} fov={35} />
            <ambientLight intensity={0.5} />
            <SpotLight position={[5, 10, 5]} angle={0.2} penumbra={1} intensity={150} castShadow shadow-mapSize={1024} />
            <pointLight position={[-3, 2, -2]} intensity={50} color={color} />

            <PresentationControls
                global
                rotation={[0, 0.3, 0]}
                polar={[-Math.PI / 3, Math.PI / 3]}
                azimuth={[-Math.PI / 1.4, Math.PI / 1.4]}
            >
                <FloatDrei speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                    <group scale={1.2}>
                         <Vase />
                         <Rose position={[0, 0.8, 0]} color={color} scale={0.6} />
                         <Rose position={[0.4, 0.6, 0.2]} color={color} scale={0.5} />
                         <Rose position={[-0.4, 0.7, -0.2]} color={color} scale={0.55} />
                         <Rose position={[0.2, 0.5, -0.4]} color={color} scale={0.45} />
                         <Rose position={[-0.2, 0.55, 0.4]} color={color} scale={0.45} />
                    </group>
                </FloatDrei>
                
                <ContactShadows 
                    position={[0, -1.2, 0]} 
                    opacity={0.6} 
                    scale={10} 
                    blur={2} 
                    far={4} 
                    resolution={512} 
                    color="#000000" 
                />
            </PresentationControls>

            <Environment preset="night" />
        </>
    );
}

export default function Room3D({ color: initialColor = "#E6E6E6" }: { color?: string } = {}) {
    const [color, setColor] = useState(initialColor);
    const colors = ["#E6E6E6", "#5A3F73", "#f43f5e", "#d946ef", "#8b5cf6", "#3b82f6"];

    useEffect(() => {
        setColor(initialColor);
    }, [initialColor]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "circOut" }}
            className="w-full h-[650px] md:h-[850px] rounded-[5rem] overflow-hidden bg-gradient-to-b from-[#2A1B38] to-[#1a1124] relative border-[1px] border-[#5A3F73]/30 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]"
        >
            <Suspense fallback={
                <div className="w-full h-full flex flex-col items-center justify-center text-[#E6E6E6]/30">
                    <div className="w-12 h-12 border-2 border-current border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="font-serif tracking-widest uppercase text-[10px]">Cargando Arte Floral...</p>
                </div>
            }>
                <Canvas shadows dpr={[1, 2]}>
                    <Scene color={color} />
                </Canvas>
            </Suspense>

            {/* Premium Selector */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 px-12 py-8 bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-2xl flex flex-col items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="h-[1px] w-8 bg-white/20"></div>
                    <span className="text-[9px] font-black uppercase tracking-[0.6em] text-white/40">Select Emotion</span>
                    <div className="h-[1px] w-8 bg-white/20"></div>
                </div>
                <div className="flex gap-6">
                    {colors.map((c) => (
                        <button
                            key={c}
                            onClick={() => setColor(c)}
                            className={cn(
                                "w-6 h-6 rounded-full border-2 transition-all hover:scale-150 shadow-2xl",
                                color === c ? "border-white scale-150 rotate-12" : "border-transparent opacity-40"
                            )}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>
            </div>

            <div className="absolute top-16 left-16 z-10">
                <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.8em] text-[#5A3F73]">Digital Atelier</span>
                    <h3 className="text-3xl font-serif text-[#E6E6E6] font-light italic">Rose Composition N°1</h3>
                </div>
            </div>
        </motion.div>
    );
}
