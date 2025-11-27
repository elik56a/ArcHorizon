
import React from 'react';
import { Room, ArchitecturalElement } from '../../../types';
import { WALL_HEIGHT, WALL_THICKNESS_EXT, WALL_THICKNESS_INT } from '../constants';
import { getHolesForWall } from '../../../utils/wallGeometry';
import { WallGenerator } from './WallGenerator';
import { AnimatedGrowth } from './AnimatedGrowth';

export const Room3D: React.FC<{ room: Room, elements: ArchitecturalElement[], yOffset: number, isVivid: boolean }> = ({ room, elements, yOffset, isVivid }) => {
  const { x, y, width, height, floorFinish, color, type } = room;
  const px = x + width / 2;
  const pz = y + height / 2;

  const isGarden = type === 'garden';
  const isParking = type === 'parking';
  const isPool = type === 'pool';
  const isBalcony = type === 'balcony' || type === 'terrace';

  let elevation = 0.1;
  if (isGarden) elevation = 0.1;
  else if (isParking) elevation = 0.2;
  else if (isPool) elevation = 0.3;
  else elevation = 2.5; 

  const floorY = elevation + yOffset;

  let floorColor = '#f5f5f5';
  let textureProps = { roughness: 0.8, metalness: 0 };

  if (isVivid) {
     if (isGarden) { floorColor = '#86efac'; textureProps = { roughness: 1, metalness: 0 }; }
     else if (isPool) { floorColor = '#06b6d4'; textureProps = { roughness: 0.1, metalness: 0.5 }; }
     else if (isParking) { floorColor = '#94a3b8'; textureProps = { roughness: 0.9, metalness: 0.1 }; }
     else if (type === 'bathroom' || type === 'kitchen') { floorColor = '#e2e8f0'; textureProps = { roughness: 0.2, metalness: 0.1 }; } 
     else if (type === 'bedroom' || type === 'living') { floorColor = '#d4a373'; textureProps = { roughness: 0.6, metalness: 0 }; } 
     else { floorColor = '#f1f5f9'; }
  } else {
     if (color) floorColor = color;
     else if (isPool) floorColor = '#06b6d4'; 
     else if (isGarden) floorColor = '#4ade80'; 
     else if (isParking) floorColor = '#9ca3af'; 
     else if (floorFinish === 'wood') floorColor = '#d4a373';
     else if (floorFinish === 'tiled') floorColor = '#e0e0e0';
  }
  
  const hasWalls = !isGarden && !isParking && !isPool;
  const wallHeight = isBalcony ? 110 : WALL_HEIGHT; 
  const wallThick = WALL_THICKNESS_EXT; 

  // Animation Wrapper for walls (grow up)
  const WallWrapper = isVivid ? AnimatedGrowth : React.Fragment;
  const wallProps = isVivid ? { delay: 0, isVivid: true } : {};

  return (
    <group>
       <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[px, floorY, pz]}>
          <planeGeometry args={[width, height]} />
          <meshStandardMaterial color={floorColor} {...textureProps} />
       </mesh>

       {hasWalls && (
           // @ts-ignore
           <WallWrapper {...wallProps}>
             <group position={[0, yOffset, 0]}>
                 <WallGenerator length={width + wallThick} height={wallHeight} thickness={wallThick} holes={getHolesForWall('north', room, elements)} position={[px, 0, y]} rotation={[0, 0, 0]} isVivid={isVivid} />
                 <WallGenerator length={width + wallThick} height={wallHeight} thickness={wallThick} holes={getHolesForWall('south', room, elements)} position={[px, 0, y + height]} rotation={[0, 0, 0]} isVivid={isVivid} />
                 <WallGenerator length={height - wallThick} height={wallHeight} thickness={wallThick} holes={getHolesForWall('west', room, elements)} position={[x, 0, pz]} rotation={[0, Math.PI / 2, 0]} isVivid={isVivid} />
                 <WallGenerator length={height - wallThick} height={wallHeight} thickness={wallThick} holes={getHolesForWall('east', room, elements)} position={[x + width, 0, pz]} rotation={[0, Math.PI / 2, 0]} isVivid={isVivid} />
             </group>
           </WallWrapper>
       )}
    </group>
  );
};
