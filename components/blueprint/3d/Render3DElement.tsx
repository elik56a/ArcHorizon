
import React, { useMemo } from 'react';
import { ArchitecturalElement, ViewStyle } from '../../../types';
import { Edges, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

interface Render3DProps {
  el: ArchitecturalElement;
  color?: string;
  viewStyle?: ViewStyle;
}

// --- PROCEDURAL FURNITURE COMPONENTS ---

const Bed = ({ w, h, isKing }: { w: number, h: number, isKing: boolean }) => {
    const mattressH = 25;
    const baseH = 15;
    const pillowW = isKing ? 60 : 50;
    
    return (
        <group position={[0, (baseH + mattressH)/2, 0]}>
            {/* Base */}
            <mesh position={[0, -mattressH/2, 0]} castShadow receiveShadow>
                <boxGeometry args={[w, baseH, h]} />
                <meshStandardMaterial color="#333" roughness={0.8} />
            </mesh>
            {/* Mattress */}
            <RoundedBox args={[w - 5, mattressH, h - 5]} radius={2} smoothness={4} castShadow receiveShadow>
                <meshStandardMaterial color="#fff" roughness={1} />
            </RoundedBox>
            {/* Blanket / Cover (Bottom Half) */}
            <group position={[0, 1, h/4]}>
                <RoundedBox args={[w - 2, mattressH + 2, h/2 + 2]} radius={3} smoothness={4} castShadow>
                    <meshStandardMaterial color="#cbd5e1" roughness={1} />
                </RoundedBox>
            </group>
            {/* Pillows */}
            <group position={[0, mattressH/2 + 5, -h/2 + 25]}>
                <mesh position={isKing ? [-w/4, 0, 0] : [0, 0, 0]} rotation={[0.2, 0, 0]} castShadow>
                    <boxGeometry args={[pillowW, 10, 35]} />
                    <meshStandardMaterial color="#fff" />
                </mesh>
                {isKing && (
                    <mesh position={[w/4, 0, 0]} rotation={[0.2, 0, 0]} castShadow>
                        <boxGeometry args={[pillowW, 10, 35]} />
                        <meshStandardMaterial color="#fff" />
                    </mesh>
                )}
            </group>
        </group>
    );
};

const Sofa = ({ w, h, isL }: { w: number, h: number, isL: boolean }) => {
    const seatH = 45;
    const backH = 85;
    const depth = isL ? 90 : h;
    const color = "#64748b"; // Slate 500
    
    return (
        <group>
            {/* Main Seat Base */}
            <RoundedBox args={[w, seatH, 80]} radius={2} smoothness={4} position={[0, seatH/2, (h-80)/2]} castShadow receiveShadow>
                <meshStandardMaterial color={color} roughness={1} />
            </RoundedBox>
            {/* Backrest */}
            <RoundedBox args={[w, backH - seatH, 20]} radius={2} smoothness={4} position={[0, seatH + (backH-seatH)/2, -h/2 + 10]} castShadow>
                <meshStandardMaterial color={color} roughness={1} />
            </RoundedBox>
            {/* Armrests */}
            <RoundedBox args={[15, 60, 80]} radius={2} smoothness={4} position={[-w/2 + 7.5, 30, (h-80)/2]} castShadow>
                <meshStandardMaterial color={color} roughness={1} />
            </RoundedBox>
            <RoundedBox args={[15, 60, 80]} radius={2} smoothness={4} position={[w/2 - 7.5, 30, (h-80)/2]} castShadow>
                <meshStandardMaterial color={color} roughness={1} />
            </RoundedBox>
            
            {/* L-Extension */}
            {isL && (
                <group position={[w/2 - 40, 0, 0]}>
                     <RoundedBox args={[80, seatH, h]} radius={2} smoothness={4} position={[0, seatH/2, 0]} castShadow receiveShadow>
                        <meshStandardMaterial color={color} roughness={1} />
                    </RoundedBox>
                </group>
            )}
        </group>
    );
};

const Table = ({ w, h, type }: { w: number, h: number, type: 'dining' | 'coffee' | 'desk' }) => {
    const height = type === 'coffee' ? 45 : 75;
    const topThick = 4;
    const legW = 5;
    const color = "#a16207"; // Wood
    
    return (
        <group>
            {/* Top */}
            <RoundedBox args={[w, topThick, h]} radius={1} smoothness={4} position={[0, height - topThick/2, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={color} roughness={0.6} />
            </RoundedBox>
            {/* Legs */}
            <group position={[0, height/2 - topThick/2, 0]}>
                <mesh position={[-w/2 + 10, 0, -h/2 + 10]} castShadow>
                    <boxGeometry args={[legW, height - topThick, legW]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
                <mesh position={[w/2 - 10, 0, -h/2 + 10]} castShadow>
                    <boxGeometry args={[legW, height - topThick, legW]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
                <mesh position={[-w/2 + 10, 0, h/2 - 10]} castShadow>
                    <boxGeometry args={[legW, height - topThick, legW]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
                <mesh position={[w/2 - 10, 0, h/2 - 10]} castShadow>
                    <boxGeometry args={[legW, height - topThick, legW]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
            </group>
        </group>
    );
};

const Cabinet = ({ w, h, height, color }: { w: number, h: number, height: number, color: string }) => (
    <group position={[0, height/2, 0]}>
        <mesh castShadow receiveShadow>
            <boxGeometry args={[w, height, h]} />
            <meshStandardMaterial color={color} roughness={0.2} metalness={0.1} />
        </mesh>
        {/* Drawers / Lines */}
        <mesh position={[0, 0, h/2 + 0.1]}>
            <planeGeometry args={[w - 2, height - 2]} />
            <meshStandardMaterial color="#000" opacity={0.1} transparent />
        </mesh>
        <mesh position={[w/4, 10, h/2 + 0.5]}>
             <cylinderGeometry args={[1,1,10]} />
             <meshStandardMaterial color="#ccc" metalness={0.8} roughness={0.2}/>
        </mesh>
    </group>
);

const WindowFrame = ({ w, h }: { w: number, h: number }) => {
    const frameT = 5;
    const depth = 10;
    return (
        <group position={[0, 110 + h/2, 0]}>
            {/* Glass */}
            <mesh position={[0,0,0]}>
                <boxGeometry args={[w - frameT*2, h - frameT*2, 2]} />
                <meshPhysicalMaterial 
                    color="#bae6fd" 
                    transmission={0.95} 
                    opacity={0.3} 
                    transparent 
                    roughness={0} 
                    metalness={0.1} 
                    thickness={2}
                />
            </mesh>
            {/* Frame Top */}
            <mesh position={[0, h/2 - frameT/2, 0]} castShadow>
                <boxGeometry args={[w, frameT, depth]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            {/* Frame Bottom (Sill) */}
            <mesh position={[0, -h/2 + frameT/2, 0]} castShadow>
                <boxGeometry args={[w, frameT, depth + 5]} /> {/* Sill sticks out */}
                <meshStandardMaterial color="#333" />
            </mesh>
            {/* Frame Left */}
            <mesh position={[-w/2 + frameT/2, 0, 0]} castShadow>
                <boxGeometry args={[frameT, h, depth]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            {/* Frame Right */}
            <mesh position={[w/2 - frameT/2, 0, 0]} castShadow>
                <boxGeometry args={[frameT, h, depth]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            {/* Mullion */}
            {w > 100 && (
                <mesh position={[0, 0, 0]} castShadow>
                    <boxGeometry args={[2, h, depth-2]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
            )}
        </group>
    )
}

const DoorFrame = ({ w, h, isGlass }: { w: number, h: number, isGlass?: boolean }) => {
    const height = 210;
    const frameW = 6;
    const depth = 12;
    const panelThick = 4;
    
    return (
        <group position={[0, height/2, 0]}>
            {/* Frame Header */}
            <mesh position={[0, height/2 - frameW/2, 0]} castShadow>
                <boxGeometry args={[w, frameW, depth]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            {/* Frame Sides */}
            <mesh position={[-w/2 + frameW/2, 0, 0]} castShadow>
                <boxGeometry args={[frameW, height, depth]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[w/2 - frameW/2, 0, 0]} castShadow>
                <boxGeometry args={[frameW, height, depth]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            
            {/* Door Leaf (Open slightly or closed) - Let's keep closed for z-buffer sanity or slightly open */}
            <group position={[-w/2 + frameW, 0, 0]} rotation={[0, 0.2, 0]}>
                 {/* Pivot Point adjustment */}
                 <group position={[(w - frameW*2)/2, 0, 0]}>
                     <mesh castShadow receiveShadow>
                        <boxGeometry args={[w - frameW*2, height - frameW, panelThick]} />
                        {isGlass ? (
                             <meshPhysicalMaterial color="#a5f3fc" transmission={0.6} roughness={0.1} transparent />
                        ) : (
                             <meshStandardMaterial color="#fff" />
                        )}
                     </mesh>
                     {/* Handle */}
                     <mesh position={[w/2 - 15, 0, panelThick + 2]}>
                         <sphereGeometry args={[3]} />
                         <meshStandardMaterial color="silver" metalness={1} roughness={0.2} />
                     </mesh>
                 </group>
            </group>
        </group>
    );
};

// --- MAIN RENDERER ---

export const Render3DElement: React.FC<Render3DProps> = ({ el, color, viewStyle }) => {
  const { width: w, height: h } = el;
  const isVivid = viewStyle === 'vivid';

  // SCHEMATIC MODE (SIMPLE BLOCKS)
  if (!isVivid) {
      let matColor = color || "#e5e7eb";
      let height3D = 50;
      if (el.type.includes('bed')) height3D = 50;
      if (el.type.includes('sofa')) height3D = 70;
      if (el.type.includes('table')) height3D = 75;
      if (el.type.includes('wardrobe')) height3D = 200;
      
      // Basic Blocks
      return (
        <group position={[0, height3D/2, 0]}>
           <mesh castShadow receiveShadow>
               <boxGeometry args={[w, height3D, h]} />
               <meshStandardMaterial color={matColor} roughness={0.7} />
               <Edges color="#9ca3af" threshold={15} />
           </mesh>
           {/* Orientation Indicator */}
           <mesh position={[0, height3D/2 + 1, h/3]}>
               <boxGeometry args={[w*0.8, 2, h/4]} />
               <meshStandardMaterial color="#cbd5e1" />
           </mesh>
        </group>
      );
  }

  // REALISTIC MODE (PROCEDURAL)
  switch (el.type) {
      case 'wall_opening': return null;
      
      case 'window': return <WindowFrame w={w} h={h} />;
      case 'entry_door': return <DoorFrame w={w} h={h} />;
      case 'door': 
      case 'door_internal' as any: 
          return <DoorFrame w={w} h={h} />;
      case 'sliding_door': return <DoorFrame w={w} h={h} isGlass />;

      case 'bed_king': return <Bed w={w} h={h} isKing={true} />;
      case 'bed_queen': return <Bed w={w} h={h} isKing={true} />; // Reuse King visuals scaled
      case 'bed_single': return <Bed w={w} h={h} isKing={false} />;
      
      case 'sofa': return <Sofa w={w} h={h} isL={false} />;
      case 'sofa_l_shape': return <Sofa w={w} h={h} isL={true} />;
      case 'armchair': return <Sofa w={w} h={h} isL={false} />; // Simplified
      
      case 'dining_table':
      case 'table':
      case 'desk': return <Table w={w} h={h} type={el.type as any} />;
      
      case 'coffee_table': return <Table w={w} h={h} type="coffee" />;
      
      case 'wardrobe': 
      case 'fridge':
          return <Cabinet w={w} h={h} height={200} color={el.type === 'fridge' ? '#94a3b8' : '#fff'} />;
      
      case 'kitchen_island': return <Cabinet w={w} h={h} height={90} color="#f8fafc" />;
      case 'stove': return <Cabinet w={w} h={h} height={90} color="#1e293b" />;
      
      case 'tv_unit':
          return (
              <group position={[0, 20, 0]}>
                  <mesh castShadow receiveShadow>
                      <boxGeometry args={[w, 40, h]} />
                      <meshStandardMaterial color="#333" />
                  </mesh>
                  {/* Screen */}
                  <mesh position={[0, 30, 0]}>
                      <boxGeometry args={[w - 10, 50, 5]} />
                      <meshStandardMaterial color="black" roughness={0.2} />
                  </mesh>
              </group>
          );

      case 'toilet':
           return (
               <group position={[0, 20, 0]}>
                   <mesh position={[0, 20, -10]} castShadow>
                       <boxGeometry args={[35, 40, 15]} />
                       <meshStandardMaterial color="white" />
                   </mesh>
                   <mesh position={[0, 0, 10]} castShadow>
                       <cylinderGeometry args={[18, 15, 40]} />
                       <meshStandardMaterial color="white" />
                   </mesh>
               </group>
           );

      // Fallback for others
      default:
          return (
            <group position={[0, 25, 0]}>
               <mesh castShadow receiveShadow>
                   <boxGeometry args={[w, 50, h]} />
                   <meshStandardMaterial color="#e5e7eb" />
               </mesh>
            </group>
          );
  }
};
