
import React from 'react';
import { ArchitecturalElement } from '../../types';
import { Edges } from '@react-three/drei';
import * as THREE from 'three';

// CONSTANTS
const FRAME_THICKNESS = 1.5; // cm

// --- 2D RENDERER ---

interface Render2DProps {
    el: ArchitecturalElement;
    isSelected: boolean;
}

export const Render2DElement: React.FC<Render2DProps> = ({ el, isSelected }) => {
    const stroke = isSelected ? "#2563eb" : "#000";
    const strokeWidth = isSelected ? 3 : 1.5;
    const detailStroke = 1;
    const { width: w, height: h } = el;

    switch (el.type) {
        case 'wall_opening':
            // Just a hole in the wall. 
            // Draw a mask to hide the black wall line.
            // h is the thickness. Mask should be slightly larger than h.
            const maskDepth = h + 10; 
            const maskOffset = (maskDepth - h) / 2;
            return (
                <g>
                    {/* Mask */}
                    <rect x={-2} y={-maskOffset} width={w + 4} height={maskDepth} fill="white" stroke="none" />
                    {/* Dashed Lines indicating beam/zone transition */}
                    <line x1={0} y1={0} x2={w} y2={0} stroke="#ccc" strokeWidth={1} strokeDasharray="4,4" />
                    <line x1={0} y1={h} x2={w} y2={h} stroke="#ccc" strokeWidth={1} strokeDasharray="4,4" />
                </g>
            );

        case 'window':
            // h is the window thickness (e.g. 22cm for 25cm wall).
            // Wall is thicker than window by 2*FRAME_THICKNESS (3cm).
            // We need a mask that covers the FULL wall thickness to cut the wall lines.
            // Mask Height = h + 2*FRAME_THICKNESS + epsilon.
            const fullWallThickness = h + (FRAME_THICKNESS * 2);
            const winMaskDepth = fullWallThickness + 2; // +2 for clean cut overlap
            const winMaskOffset = (winMaskDepth - h) / 2;
            
            return (
                <g>
                    {/* 1. White Mask to cut the Wall Lines */}
                    <rect x={-2} y={-winMaskOffset} width={w + 4} height={winMaskDepth} fill="white" stroke="none" />
                    
                    {/* 2. The Window Frame Box (Recessed) */}
                    <rect x={0} y={0} width={w} height={h} fill="white" stroke="black" strokeWidth={1.5} />
                    
                    {/* 3. Glass Line (Centered) */}
                    <line x1={0} y1={h/2} x2={w} y2={h/2} stroke="black" strokeWidth={0.5} />
                    
                    {/* 4. Optional: Side Frame indicators (filled rects) */}
                    {/* <rect x={0} y={0} width={4} height={h} fill="black" />
                    <rect x={w-4} y={0} width={4} height={h} fill="black" /> */}
                </g>
            );

        case 'entry_door':
            return (
                <g>
                    <rect x={-1} y={0} width={w+2} height={h} fill="white" stroke="none" />
                    <path d={`M 0 ${h} A ${w} ${w} 0 0 1 ${w} 0`} fill="none" stroke={stroke} strokeWidth={detailStroke} />
                    <rect x={0} y={h-6} width={w} height={6} fill="black" transform={`rotate(-90 0 ${h})`} />
                    {/* Main Entry Marker Triangle */}
                    <path d={`M ${w/2 - 15} ${h + 10} L ${w/2 + 15} ${h + 10} L ${w/2} ${h + 35} Z`} fill="black" stroke="none" />
                </g>
            );

        case 'door':
            return (
                <g>
                    <rect x={-1} y={0} width={w+2} height={h} fill="white" stroke="none" />
                    <path d={`M 0 ${h} A ${w} ${w} 0 0 1 ${w} 0`} fill="none" stroke={stroke} strokeWidth={detailStroke} strokeDasharray="4,4" />
                    <line x1={0} y={h} x2={w} y2={0} stroke={stroke} strokeWidth={strokeWidth} />
                    <rect x={0} y={0} width={4} height={h} fill="white" stroke="black" strokeWidth={1}/> 
                    <rect x={w-4} y={0} width={4} height={h} fill="white" stroke="black" strokeWidth={1}/>
                </g>
            );

        case 'garden':
        case 'tree': 
            return (
                <g>
                    <circle cx={w/2} cy={h/2} r={Math.min(w,h)/2} fill="#dcfce7" stroke="#166534" strokeWidth={1.5} strokeDasharray="4,2" />
                    <circle cx={w/2} cy={h/2} r={2} fill="#166534" />
                </g>
            );
        
        case 'parking': 
        case 'car':
             return (
                <g>
                    <rect x={w*0.1} y={h*0.1} width={w*0.8} height={h*0.8} rx={10} fill="none" stroke={stroke} strokeWidth={1.5} />
                    <line x1={w*0.15} y1={h*0.3} x2={w*0.85} y2={h*0.3} stroke={stroke} strokeWidth={1} />
                    <line x1={w*0.15} y1={h*0.7} x2={w*0.85} y2={h*0.7} stroke={stroke} strokeWidth={1} />
                    <rect x={0} y={h*0.2} width={w*0.1} height={h*0.2} fill="black" />
                    <rect x={w*0.9} y={h*0.2} width={w*0.1} height={h*0.2} fill="black" />
                    <rect x={0} y={h*0.6} width={w*0.1} height={h*0.2} fill="black" />
                    <rect x={w*0.9} y={h*0.6} width={w*0.1} height={h*0.2} fill="black" />
                </g>
             );

        case 'pool':
             return (
                 <g>
                     <rect x={0} y={0} width={w} height={h} fill="#cffafe" stroke="#06b6d4" strokeWidth={2} />
                     <path d={`M ${w*0.2} ${h*0.2} Q ${w*0.3} ${h*0.15} ${w*0.4} ${h*0.2}`} fill="none" stroke="#06b6d4" strokeWidth={1} opacity={0.5} />
                     <path d={`M ${w*0.6} ${h*0.7} Q ${w*0.7} ${h*0.65} ${w*0.8} ${h*0.7}`} fill="none" stroke="#06b6d4" strokeWidth={1} opacity={0.5} />
                 </g>
             );

        case 'bed_king':
        case 'bed_queen':
        case 'bed_single':
            return (
                <g>
                    <rect x={0} y={0} width={w} height={h} fill="white" stroke={stroke} strokeWidth={strokeWidth} />
                    <rect x={0} y={0} width={w} height={h * 0.25} fill="none" stroke={stroke} strokeWidth={detailStroke} />
                    <rect x={w * 0.1} y={h * 0.05} width={w * 0.35} height={h * 0.15} rx={2} fill="white" stroke={stroke} strokeWidth={detailStroke} />
                    {el.type !== 'bed_single' && (
                        <rect x={w * 0.55} y={h * 0.05} width={w * 0.35} height={h * 0.15} rx={2} fill="white" stroke={stroke} strokeWidth={detailStroke} />
                    )}
                    <path d={`M 0 ${h*0.3} Q ${w/2} ${h*0.35} ${w} ${h*0.3}`} fill="none" stroke={stroke} strokeWidth={detailStroke} />
                </g>
            );
            
        case 'sofa':
        case 'sofa_l_shape':
             return (
                <g>
                    <rect x={0} y={0} width={w} height={h} fill="white" stroke={stroke} strokeWidth={strokeWidth} />
                    <rect x={0} y={0} width={w} height={h * 0.25} fill="none" stroke={stroke} strokeWidth={detailStroke} />
                    <rect x={0} y={0} width={w * 0.15} height={h} fill="none" stroke={stroke} strokeWidth={detailStroke} />
                    <rect x={w * 0.85} y={0} width={w * 0.15} height={h} fill="none" stroke={stroke} strokeWidth={detailStroke} />
                </g>
            );

        case 'toilet':
             return (
                <g>
                    <rect x={0} y={0} width={w} height={h*0.3} fill="white" stroke={stroke} strokeWidth={strokeWidth} />
                    <path d={`M ${w*0.2} ${h*0.3} L ${w*0.2} ${h*0.6} C ${w*0.2} ${h} ${w*0.8} ${h} ${w*0.8} ${h*0.6} L ${w*0.8} ${h*0.3} Z`} fill="white" stroke={stroke} strokeWidth={strokeWidth} />
                </g>
            );

        case 'sink_single':
        case 'sink_double':
            return (
                <g>
                    <rect x={0} y={0} width={w} height={h} rx={4} fill="white" stroke={stroke} strokeWidth={strokeWidth} />
                    <circle cx={w/2} cy={h/2} r={Math.min(w,h)*0.3} fill="none" stroke={stroke} strokeWidth={detailStroke} />
                </g>
            );

        default:
            return (
                <g>
                    <rect x={0} y={0} width={w} height={h} fill="white" stroke={stroke} strokeWidth={strokeWidth} />
                    <line x1={0} y1={0} x2={w} y2={h} stroke={stroke} strokeWidth={detailStroke} opacity={0.3} />
                    <line x1={w} y1={0} x2={0} y2={h} stroke={stroke} strokeWidth={detailStroke} opacity={0.3} />
                </g>
            );
    }
};


// --- 3D RENDERER ---

interface Render3DProps {
    el: ArchitecturalElement;
    color?: string;
}

export const Render3DElement: React.FC<Render3DProps> = ({ el, color }) => {
    const { width: w, height: h, type } = el;
    
    switch (type) {
        case 'wall_opening':
            // Invisible in 3D scene, just creates a hole via Canvas3D logic
            return null;

        case 'window':
            // h is thickness (e.g. 22cm). 
            // Wall hole logic in Canvas3D ensures the hole matches width (length).
            // We render the window centered in that hole.
            return (
                <group position={[0, 110, 0]}>
                     {/* Frame - Exactly the thickness of the window object */}
                     <mesh>
                        <boxGeometry args={[w + 2, 110, h]} />
                        <meshStandardMaterial color="#111" />
                     </mesh>
                     {/* Glass */}
                    <mesh>
                        <boxGeometry args={[w, 100, 2]} />
                        <meshPhysicalMaterial color="#88ccff" roughness={0} transmission={0.6} transparent opacity={0.4} />
                    </mesh>
                </group>
            );

        case 'entry_door':
             return (
                <group position={[0, 110, 0]}>
                    <mesh>
                         <boxGeometry args={[w + 4, 220, h]} />
                         <meshStandardMaterial color="#1f2937" />
                    </mesh>
                    <mesh position={[0, -10, 0]}>
                         <boxGeometry args={[w - 6, 200, 6]} />
                         <meshStandardMaterial color="#451a03" />
                    </mesh>
                    <mesh position={[-w/2 + 10, -10, 5]}>
                         <cylinderGeometry args={[1, 1, 30]} />
                         <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
                    </mesh>
                </group>
             );
        
        case 'door':
            return (
               <group position={[0, 100, 0]}>
                   <mesh>
                       <boxGeometry args={[w + 4, 200, h]} />
                       <meshStandardMaterial color="#333" />
                   </mesh>
                   <mesh position={[0, -5, 0]}>
                       <boxGeometry args={[w - 4, 190, 4]} />
                       <meshStandardMaterial color="#f3f4f6" />
                   </mesh>
               </group>
            );
        
        case 'pool':
             return (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -20, 0]}>
                     <planeGeometry args={[w, h]} />
                     <meshPhysicalMaterial color="#06b6d4" transmission={0.8} roughness={0.1} opacity={0.8} transparent />
                </mesh>
             );

        case 'tree':
        case 'garden':
             return (
                <group position={[0, 0, 0]}>
                     <mesh position={[0, 40, 0]}>
                         <cylinderGeometry args={[10, 15, 80]} />
                         <meshStandardMaterial color="#5D4037" />
                     </mesh>
                     <mesh position={[0, 120, 0]}>
                         <dodecahedronGeometry args={[60]} />
                         <meshStandardMaterial color="#4ade80" roughness={1} />
                     </mesh>
                </group>
             );

        case 'car':
        case 'parking':
             return (
                <group position={[0, 30, 0]}>
                     <mesh position={[0, 20, 0]}>
                         <boxGeometry args={[w*0.8, 40, h*0.9]} />
                         <meshStandardMaterial color="#3b82f6" />
                         <Edges color="black" />
                     </mesh>
                     <mesh position={[0, 50, -10]}>
                         <boxGeometry args={[w*0.7, 30, h*0.5]} />
                         <meshStandardMaterial color="#93c5fd" opacity={0.5} transparent />
                     </mesh>
                     <mesh position={[w*0.4, 0, h*0.25]} rotation={[0,0,Math.PI/2]}>
                         <cylinderGeometry args={[15, 15, 10]} />
                         <meshStandardMaterial color="black" />
                     </mesh>
                     <mesh position={[-w*0.4, 0, h*0.25]} rotation={[0,0,Math.PI/2]}>
                         <cylinderGeometry args={[15, 15, 10]} />
                         <meshStandardMaterial color="black" />
                     </mesh>
                     <mesh position={[w*0.4, 0, -h*0.25]} rotation={[0,0,Math.PI/2]}>
                         <cylinderGeometry args={[15, 15, 10]} />
                         <meshStandardMaterial color="black" />
                     </mesh>
                     <mesh position={[-w*0.4, 0, -h*0.25]} rotation={[0,0,Math.PI/2]}>
                         <cylinderGeometry args={[15, 15, 10]} />
                         <meshStandardMaterial color="black" />
                     </mesh>
                </group>
             );

        case 'bed_king':
        case 'bed_queen':
             return (
                <group>
                    <mesh position={[0, 20, 0]}>
                        <boxGeometry args={[w, 40, h]} />
                        <meshStandardMaterial color="#fff" />
                        <Edges color="#ccc" />
                    </mesh>
                    <mesh position={[0, 50, -h/2 + 5]}>
                        <boxGeometry args={[w, 40, 10]} />
                        <meshStandardMaterial color="#94a3b8" />
                    </mesh>
                </group>
             );
        
        case 'sofa':
        case 'sofa_l_shape':
             return (
                <group>
                     <mesh position={[0, 20, 0]}>
                         <boxGeometry args={[w, 45, h]} />
                         <meshStandardMaterial color="#e2e8f0" />
                     </mesh>
                     <mesh position={[0, 45, -h/3]}>
                         <boxGeometry args={[w, 40, h/3]} />
                         <meshStandardMaterial color="#cbd5e1" />
                     </mesh>
                </group>
             );
        
        default:
             return (
                 <mesh position={[0, 10, 0]}>
                     <boxGeometry args={[w, 20, h]} />
                     <meshStandardMaterial color={color || "#e5e5e5"} />
                     <Edges color="#999" />
                 </mesh>
             );
    }
}
