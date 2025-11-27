
import React from 'react';
import { Hole } from '../../../utils/wallGeometry';

interface WallGeneratorProps {
  length: number;
  height: number;
  thickness: number;
  holes: Hole[];
  position: [number, number, number]; 
  rotation: [number, number, number];
  isVivid: boolean;
}

export const WallGenerator: React.FC<WallGeneratorProps> = ({ length, height, thickness, holes, position, rotation, isVivid }) => {
  const sortedHoles = [...holes].sort((a, b) => a.start - b.start);
  const segments = [];
  let cursor = 0;

  sortedHoles.forEach((hole, idx) => {
      const holeStart = Math.max(0, hole.start);
      const holeEnd = Math.min(length, hole.start + hole.width);
      const holeW = holeEnd - holeStart;
      if (holeW <= 0) return;

      const solidLength = holeStart - cursor;
      if (solidLength > 1) {
          segments.push({ type: 'solid', width: solidLength, height: height, x: cursor + solidLength / 2, y: height / 2 });
      }
      if (hole.bottom > 1) {
          segments.push({ type: 'sill', width: holeW, height: hole.bottom, x: holeStart + holeW / 2, y: hole.bottom / 2 });
      }
      const headerHeight = height - (hole.bottom + hole.height);
      if (headerHeight > 1) {
          segments.push({ type: 'header', width: holeW, height: headerHeight, x: holeStart + holeW / 2, y: height - headerHeight / 2 });
      }
      cursor = holeEnd;
  });

  const remaining = length - cursor;
  if (remaining > 1) {
      segments.push({ type: 'solid', width: remaining, height: height, x: cursor + remaining / 2, y: height / 2 });
  }

  return (
      <group position={position} rotation={rotation}>
          <group position={[-length / 2, 0, 0]}>
            {segments.map((seg, i) => (
                <mesh key={i} position={[seg.x, seg.y, 0]} castShadow receiveShadow>
                    <boxGeometry args={[seg.width, seg.height, thickness]} />
                    {isVivid 
                        ? <meshStandardMaterial color="#f3f4f6" roughness={0.9} /> 
                        : <meshStandardMaterial color="white" roughness={0.8} />   
                    }
                </mesh>
            ))}
          </group>
      </group>
  );
};
