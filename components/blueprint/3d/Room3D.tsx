
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Room, ArchitecturalElement } from '../../../types';
import { WALL_HEIGHT, WALL_THICKNESS_EXT } from '../constants';
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

  // Base Elevation
  let elevation = 0;
  if (isGarden) elevation = -2;
  else if (isParking) elevation = 1;
  else if (isPool) elevation = -10;
  else elevation = 2; // Slight lift to avoid z-fighting with grid

  const floorY = elevation + yOffset;

  // Material Properties
  let floorColor = '#f5f5f5';
  let textureProps: any = { roughness: 0.8, metalness: 0 };

  if (isVivid) {
     if (isGarden) { floorColor = '#86efac'; textureProps = { roughness: 1, metalness: 0 }; }
     else if (isPool) { floorColor = '#06b6d4'; textureProps = { roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.8 }; }
     else if (isParking) { floorColor = '#94a3b8'; textureProps = { roughness: 0.9, metalness: 0.1 }; }
     else if (type === 'bathroom' || type === 'kitchen') { floorColor = '#e2e8f0'; textureProps = { roughness: 0.2, metalness: 0.1 }; } // Tiles
     else if (type === 'bedroom' || type === 'living') { floorColor = '#d4a373'; textureProps = { roughness: 0.6, metalness: 0 }; } // Wood
     else { floorColor = '#f1f5f9'; }
  } else {
     // Schematic Colors
     if (color) floorColor = color;
     else if (isPool) floorColor = '#bae6fd'; 
     else if (isGarden) floorColor = '#dcfce7'; 
     else if (isParking) floorColor = '#e5e7eb'; 
     else if (floorFinish === 'wood') floorColor = '#fde68a';
     else if (floorFinish === 'tiled') floorColor = '#f1f5f9';
  }
  
  const hasWalls = !isGarden && !isParking && !isPool;
  const wallHeight = isBalcony ? 110 : WALL_HEIGHT; 
  const wallThick = WALL_THICKNESS_EXT; 

  // --- BASEBOARDS GENERATION ---
  // Simple perimeter logic: 4 boxes around the room floor
  const renderBaseboards = () => {
      if (!isVivid || !hasWalls || isBalcony) return null;
      const h = 12; // 12cm height
      const t = 2;  // 2cm thickness
      const off = t/2; // offset to align with inner wall face
      const mat = <meshStandardMaterial color="#fff" roughness={0.5} />;
      const yPos = floorY + h/2;

      // We need to subtract door holes from baseboards ideally, but for now simple perimeter is huge visual upgrade
      // Inner perimeter is: x + wallThick/2 ...
      // But the room rect ALREADY represents the inner volume mostly in this data model, or centerlines? 
      // The `WallGenerator` uses holes. 
      // Simplified: Just draw 4 strips.
      return (
          <group position={[0, 0, 0]}>
              {/* North */}
              <mesh position={[px, yPos, y + t/2]} receiveShadow>
                  <boxGeometry args={[width, h, t]} />
                  {mat}
              </mesh>
              {/* South */}
              <mesh position={[px, yPos, y + height - t/2]} receiveShadow>
                  <boxGeometry args={[width, h, t]} />
                  {mat}
              </mesh>
              {/* West */}
              <mesh position={[x + t/2, yPos, pz]} receiveShadow>
                  <boxGeometry args={[t, h, height - t*2]} />
                  {mat}
              </mesh>
              {/* East */}
              <mesh position={[x + width - t/2, yPos, pz]} receiveShadow>
                  <boxGeometry args={[t, h, height - t*2]} />
                  {mat}
              </mesh>
          </group>
      )
  };

  const WallWrapper = isVivid ? AnimatedGrowth : React.Fragment;
  const wallProps = isVivid ? { delay: 0, isVivid: true } : {};

  return (
    <group>
       {/* FLOOR PLANE */}
       <mesh 
            receiveShadow 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[px, floorY, pz]}
        >
          <planeGeometry args={[width, height]} />
          {isVivid ? (
              <meshPhysicalMaterial 
                color={floorColor} 
                {...textureProps} 
                polygonOffset 
                polygonOffsetFactor={1} // Pushes floor BACK so anything on top (furniture) wins Z-fight
                polygonOffsetUnits={1}
              />
          ) : (
              <meshStandardMaterial 
                color={floorColor} 
                polygonOffset 
                polygonOffsetFactor={1} 
                polygonOffsetUnits={1}
              />
          )}
       </mesh>

       {/* BASEBOARDS (Realistic Mode Only) */}
       {renderBaseboards()}

       {/* WALLS */}
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
