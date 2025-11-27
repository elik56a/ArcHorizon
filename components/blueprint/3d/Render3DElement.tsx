
import React from 'react';
import { ArchitecturalElement, ViewStyle } from '../../../types';
import { Edges } from '@react-three/drei';

interface Render3DProps {
  el: ArchitecturalElement;
  color?: string;
  viewStyle?: ViewStyle;
}

export const Render3DElement: React.FC<Render3DProps> = ({ el, color, viewStyle }) => {
  const { width: w, height: h } = el;
  const isVivid = viewStyle === 'vivid';

  let matColor = color || "#e5e7eb";
  let height3D = 0;

  switch (el.type) {
      case 'wall_opening': return null; // Invisible in 3D, hole handles it
      
      case 'window':
           return (
               <group position={[0, 110 + 55, 0]}>
                   <mesh castShadow receiveShadow>
                       <boxGeometry args={[w, 110, 5]} />
                       <meshStandardMaterial color="#93c5fd" transparent opacity={0.3} roughness={0} metalness={0.9} />
                   </mesh>
                   <mesh>
                        <boxGeometry args={[w + 5, 115, 6]} />
                        <Edges color="#333" />
                        <meshStandardMaterial visible={false} />
                   </mesh>
               </group>
           );

      case 'entry_door':
      case 'door':
      case 'door_internal' as any:
      case 'internal_door' as any:
           return (
               <group position={[0, 105, 0]}>
                   <mesh castShadow receiveShadow>
                       <boxGeometry args={[w, 210, 5]} />
                       <meshStandardMaterial color={el.type === 'entry_door' ? '#475569' : '#fff'} />
                   </mesh>
                   <mesh position={[w/2 - 10, 0, 5]}>
                       <boxGeometry args={[5, 40, 2]} />
                       <meshStandardMaterial color="#94a3b8" />
                   </mesh>
               </group>
           );
      
      case 'sliding_door':
           return (
               <group position={[0, 105, 0]}>
                    <mesh position={[0, 0, 0]}>
                        <boxGeometry args={[w, 210, 2]} />
                        <meshStandardMaterial color="#a5f3fc" transparent opacity={0.4} />
                    </mesh>
                    <mesh position={[0, 0, 0]}>
                        <boxGeometry args={[w, 210, 5]} />
                        <Edges color="#64748b" />
                        <meshStandardMaterial visible={false} />
                    </mesh>
               </group>
           );

      case 'bed_king': height3D = 50; matColor = "#f8fafc"; break;
      case 'bed_queen': height3D = 50; matColor = "#f8fafc"; break;
      case 'bed_single': height3D = 50; matColor = "#f8fafc"; break;
      
      case 'sofa': height3D = 70; matColor = "#94a3b8"; break;
      case 'sofa_l_shape': height3D = 70; matColor = "#94a3b8"; break;
      case 'armchair': height3D = 70; matColor = "#94a3b8"; break;
      
      case 'table': height3D = 75; matColor = "#d4a373"; break;
      case 'dining_table': height3D = 75; matColor = "#d4a373"; break;
      case 'desk': height3D = 75; matColor = "#d4a373"; break;
      case 'nightstand': height3D = 45; matColor = "#d4a373"; break;
      
      case 'wardrobe': height3D = 200; matColor = "#fff"; break;
      case 'bookshelf': height3D = 180; matColor = "#d4a373"; break;
      case 'tv_unit': height3D = 40; matColor = "#334155"; break;
      
      case 'kitchen_island': height3D = 90; matColor = "#f1f5f9"; break;
      case 'stove': height3D = 90; matColor = "#1e293b"; break;
      case 'fridge': height3D = 180; matColor = "#cbd5e1"; break;
      case 'washer': height3D = 85; matColor = "#fff"; break;
      case 'dryer': height3D = 85; matColor = "#fff"; break;
      
      case 'toilet': height3D = 40; matColor = "#fff"; break;
      case 'sink_single': height3D = 80; matColor = "#fff"; break;
      case 'sink_double': height3D = 80; matColor = "#fff"; break;
      case 'bathtub': height3D = 55; matColor = "#fff"; break;
      case 'shower': height3D = 210; matColor = "#a5f3fc"; break;
      
      case 'stairs': 
      case 'stairs_up': 
      case 'stairs_down':
           return (
                <group position={[0, 140, 0]}>
                    <mesh castShadow receiveShadow rotation={[0.5, 0, 0]}>
                        <boxGeometry args={[w, 300, 20]} />
                        <meshStandardMaterial color="#e2e8f0" />
                    </mesh>
                </group>
           );
           
      case 'tree':
      case 'garden':
           return (
               <group position={[0, 0, 0]}>
                    <mesh position={[0, 30, 0]} castShadow>
                        <cylinderGeometry args={[5, 10, 60]} />
                        <meshStandardMaterial color="#854d0e" />
                    </mesh>
                    <mesh position={[0, 100, 0]} castShadow>
                        <dodecahedronGeometry args={[50]} />
                        <meshStandardMaterial color="#16a34a" />
                    </mesh>
               </group>
           );
           
      case 'parking':
      case 'car':
            return (
                <group position={[0, 30, 0]}>
                    <mesh castShadow receiveShadow>
                        <boxGeometry args={[w, 60, h]} />
                        <meshStandardMaterial color="#3b82f6" roughness={0.2} metalness={0.7} />
                    </mesh>
                </group>
            );

      default: height3D = 50; matColor = "#ccc"; break;
  }

  // Generic Block Render for Furniture
  return (
    <group position={[0, height3D/2, 0]}>
       <mesh castShadow receiveShadow>
           <boxGeometry args={[w, height3D, h]} />
           <meshStandardMaterial color={isVivid ? matColor : "#e5e7eb"} roughness={0.7} />
           <Edges color="#9ca3af" threshold={15} />
       </mesh>
       {/* Simple detail for orientation */}
       <mesh position={[0, height3D/2 + 1, h/3]}>
           <boxGeometry args={[w*0.8, 2, h/4]} />
           <meshStandardMaterial color="#cbd5e1" />
       </mesh>
    </group>
  );
};
