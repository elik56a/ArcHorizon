
import React from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { ArchitecturalElement } from '../../../types';
import { Render3DElement } from './Render3DElement';
import { AnimatedGrowth } from './AnimatedGrowth';

interface Element3DProps {
    element: ArchitecturalElement;
    onPointerDown: (e: ThreeEvent<PointerEvent>, id: string) => void;
    elementRefs: React.MutableRefObject<{[key: string]: THREE.Group}>;
    yOffset: number;
    isVivid: boolean;
    index: number;
}

export const Element3D: React.FC<Element3DProps> = ({ element, onPointerDown, elementRefs, yOffset, isVivid, index }) => {
  const { x, y, width, height, rotation, id, color } = element;
  const px = x + width / 2;
  const pz = y + height / 2;
  const rotY = -rotation * (Math.PI / 180);
  const baseY = 0 + yOffset; 

  const setRef = (el: any) => { if (el) elementRefs.current[id] = el; };

  // Staggered animation for vivid mode
  const Wrapper = isVivid ? AnimatedGrowth : React.Fragment;
  const wrapperProps = isVivid ? { delay: index * 50, isVivid: true } : {};

  return (
    // @ts-ignore
    <Wrapper {...wrapperProps}>
        <group 
            ref={setRef} 
            position={[px, baseY, pz]} 
            rotation={[0, rotY, 0]} 
            onPointerDown={(e) => { e.stopPropagation(); onPointerDown(e, id); }}
        >
            <Render3DElement el={element} color={color} viewStyle={isVivid ? 'vivid' : 'blueprint'} />
        </group>
    </Wrapper>
  );
};
