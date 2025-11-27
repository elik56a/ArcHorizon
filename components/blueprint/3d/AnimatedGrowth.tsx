
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const AnimatedGrowth: React.FC<{ children: React.ReactNode, delay?: number, isVivid: boolean }> = ({ children, delay = 0, isVivid }) => {
    const groupRef = useRef<THREE.Group>(null);
    const [targetScale, setTargetScale] = useState(0);

    useEffect(() => {
        if (isVivid) {
            setTargetScale(0);
            const t = setTimeout(() => setTargetScale(1), delay);
            return () => clearTimeout(t);
        } else {
            setTargetScale(1);
        }
    }, [isVivid, delay]);

    useFrame((state, delta) => {
        if (groupRef.current) {
            const current = groupRef.current.scale.y;
            // Smooth lerp
            const diff = targetScale - current;
            if (Math.abs(diff) > 0.001) {
                groupRef.current.scale.y = THREE.MathUtils.lerp(current, targetScale, delta * 4);
                groupRef.current.scale.x = THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, delta * 4);
                groupRef.current.scale.z = THREE.MathUtils.lerp(groupRef.current.scale.z, targetScale, delta * 4);
            }
        }
    });

    return <group ref={groupRef}>{children}</group>;
};
