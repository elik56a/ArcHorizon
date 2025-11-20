import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges } from '@react-three/drei';

export const RotatingHouse = () => {
    const groupRef = useRef<any>(null);
    
    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.5; 
        }
    });

    return (
        <group ref={groupRef} rotation={[0.3, -0.5, 0]} scale={1.2}>
            {/* BASEMENT / GROUND */}
            <mesh position={[0, -0.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[3, 0.2, 3]} />
                <meshStandardMaterial color="#e5e7eb" />
                <Edges color="#9ca3af" />
            </mesh>
            
            {/* FLOOR 1 MAIN */}
            <mesh position={[-0.5, 0.2, 0.5]} castShadow receiveShadow>
                <boxGeometry args={[1.5, 1.2, 1.5]} />
                <meshStandardMaterial color="white" />
                <Edges color="#94a3b8" />
            </mesh>
            {/* F1 GLASS */}
            <mesh position={[-0.5, 0.2, 1.26]}>
                <planeGeometry args={[1, 0.8]} />
                <meshStandardMaterial color="#93c5fd" roughness={0.1} metalness={0.8} />
            </mesh>

            {/* FLOOR 1 WING */}
            <mesh position={[0.8, 0.1, -0.5]} castShadow receiveShadow>
                <boxGeometry args={[1.2, 1, 1.5]} />
                <meshStandardMaterial color="#f3f4f6" />
                <Edges color="#94a3b8" />
            </mesh>

            {/* FLOOR 2 CANTILEVER */}
            <mesh position={[0.2, 1.4, 0]} castShadow receiveShadow>
                <boxGeometry args={[2.5, 1.2, 1.8]} />
                <meshStandardMaterial color="white" />
                <Edges color="#94a3b8" />
            </mesh>
            {/* F2 STRIP WINDOW */}
            <mesh position={[0.2, 1.4, 0.91]}>
                <planeGeometry args={[2, 0.5]} />
                <meshStandardMaterial color="#93c5fd" roughness={0.1} metalness={0.8} />
            </mesh>

            {/* POOL */}
            <mesh position={[1, -0.35, 1]} rotation={[-Math.PI/2, 0, 0]}>
                <planeGeometry args={[1.2, 0.8]} />
                <meshStandardMaterial color="#06b6d4" />
            </mesh>

            {/* TREES (Abstract) */}
            <mesh position={[-1.2, 0, 1.2]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, 0.4]} />
                <meshStandardMaterial color="#8b5cf6" />
            </mesh>
            <mesh position={[-1.2, 0.4, 1.2]} castShadow>
                <dodecahedronGeometry args={[0.25]} />
                <meshStandardMaterial color="#10b981" />
            </mesh>
        </group>
    );
};