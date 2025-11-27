
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
            const maskDepth = h + 10; 
            const maskOffset = (maskDepth - h) / 2;
            return (
                <g>
                    <rect x={-2} y={-maskOffset} width={w + 4} height={maskDepth} fill="white" stroke="none" />
                    {/* Beam / Threshold Lines */}
                    <line x1={0} y1={0} x2={w} y2={0} stroke="#ccc" strokeWidth={1} strokeDasharray="4,4" />
                    <line x1={0} y1={h} x2={w} y2={h} stroke="#ccc" strokeWidth={1} strokeDasharray="4,4" />
                </g>
            );

        case 'window':
            const fullWallThickness = h + (FRAME_THICKNESS * 2);
            const winMaskDepth = fullWallThickness + 2;
            const winMaskOffset = (winMaskDepth - h) / 2;
            
            return (
                <g>
                    {/* Mask */}
                    <rect x={-2} y={-winMaskOffset} width={w + 4} height={winMaskDepth} fill="white" stroke="none" />
                    {/* Frame */}
                    <rect x={0} y={0} width={w} height={h} fill="white" stroke="black" strokeWidth={1.5} />
                    {/* Glass - Centered */}
                    <line x1={0} y1={h/2} x2={w} y2={h/2} stroke="black" strokeWidth={0.5} />
                    {/* Side Indicators */}
                    <rect x={0} y={0} width={3} height={h} fill="black" />
                    <rect x={w-3} y={0} width={3} height={h} fill="black" />
                </g>
            );

        case 'entry_door':
            // Mask
            const entryMaskH = h + 10; 
            const entryMaskY = -(entryMaskH - h)/2;
            return (
                <g>
                    <rect x={-5} y={entryMaskY} width={w+10} height={entryMaskH} fill="white" stroke="none" />
                    {/* Door Leaf */}
                    <rect x={0} y={0} width={5} height={w} fill="white" stroke={stroke} strokeWidth={strokeWidth} />
                    {/* Swing Arc */}
                    <path d={`M 5 ${w} A ${w} ${w} 0 0 0 ${w} ${5}`} fill="none" stroke={stroke} strokeWidth={detailStroke} strokeDasharray="4,4" />
                    
                    {/* Main Entry Marker - Enhanced Arrow */}
                    <path d={`M ${w/2} -30 L ${w/2 - 10} -45 L ${w/2 + 10} -45 Z`} fill="black" stroke="none" />
                </g>
            );

        case 'door':
        case 'door_internal' as any:
        case 'internal_door' as any:
            const doorMaskH = h + 10; 
            const doorMaskY = -(doorMaskH - h)/2;
            return (
                <g>
                    <rect x={-5} y={doorMaskY} width={w+10} height={doorMaskH} fill="white" stroke="none" />
                    <rect x={0} y={0} width={5} height={w} fill="white" stroke={stroke} strokeWidth={strokeWidth} />
                    <path d={`M 5 ${w} A ${w} ${w} 0 0 0 ${w} ${5}`} fill="none" stroke={stroke} strokeWidth={detailStroke} />
                </g>
            );

        case 'sliding_door':
             const slideMaskH = h + 10;
             const slideMaskY = -(slideMaskH - h)/2;
             return (
                 <g>
                    <rect x={-5} y={slideMaskY} width={w+10} height={slideMaskH} fill="white" stroke="none" />
                    <line x1={0} y1={h/2} x2={w} y2={h/2} stroke={stroke} strokeWidth={0.5} />
                    <rect x={0} y={h/2 - 3} width={w/2 + 5} height={6} fill="white" stroke={stroke} strokeWidth={1.5} />
                    <rect x={w/2 - 5} y={h/2 - 3} width={w/2 + 5} height={6} fill="white" stroke={stroke} strokeWidth={1.5} transform={`translate(0, ${h > 10 ? 6 : 2})`} />
                 </g>
             );
        
        case 'stairs':
        case 'stairs_up':
        case 'stairs_down':
            const isUp = el.type !== 'stairs_down';
            const numSteps = 12; 
            const isHorizontal = w > h;
            
            return (
                <g>
                    {/* Outline */}
                    <rect x={0} y={0} width={w} height={h} fill="white" stroke={stroke} strokeWidth={strokeWidth} />
                    
                    {/* Treads */}
                    {Array.from({length: numSteps}).map((_, i) => {
                         if (isHorizontal) {
                             return <line key={i} x1={i * (w/numSteps)} y1={0} x2={i * (w/numSteps)} y2={h} stroke={stroke} strokeWidth={1} opacity={0.5} />
                         } else {
                             return <line key={i} x1={0} y1={i * (h/numSteps)} x2={w} y2={i * (h/numSteps)} stroke={stroke} strokeWidth={1} opacity={0.5} />
                         }
                    })}

                    {/* Direction Arrow */}
                     <defs>
                        <marker id={`arrow-${el.id}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                            <path d="M0,0 L6,3 L0,6 L0,0" fill={stroke} />
                        </marker>
                         <marker id={`dot-${el.id}`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                            <circle cx="3" cy="3" r="2" fill={stroke} />
                        </marker>
                    </defs>
                    
                    {isHorizontal ? (
                         <line x1={w*0.1} y1={h/2} x2={w*0.9} y2={h/2} stroke={stroke} strokeWidth={1.5} markerEnd={`url(#arrow-${el.id})`} markerStart={`url(#dot-${el.id})`} />
                    ) : (
                         <line x1={w/2} y1={h*0.1} x2={w/2} y2={h*0.9} stroke={stroke} strokeWidth={1.5} markerEnd={`url(#arrow-${el.id})`} markerStart={`url(#dot-${el.id})`} />
                    )}
                    
                    <text x={w/2} y={h/2} fontSize={10} fontFamily="sans-serif" fontWeight="bold" fill={stroke} textAnchor="middle" dy={isHorizontal ? -10 : 0} dx={isHorizontal ? 0 : 10}>
                        {isUp ? 'UP' : 'DN'}
                    </text>
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
                    <line x1={0} y={0} x2={w} y2={h} stroke={stroke} strokeWidth={detailStroke} opacity={0.3} />
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
            return null;

        case 'window':
            return (
                <group position={[0, 110, 0]}>
                     <mesh>
                        <boxGeometry args={[w, 110, h]} />
                        <meshStandardMaterial color="#111" />
                     </mesh>
                    <mesh>
                        <boxGeometry args={[w - 4, 100, 2]} />
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
        case 'door_internal' as any:
        case 'internal_door' as any:
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
        
        case 'stairs':
        case 'stairs_up':
        case 'stairs_down':
             const stepCount = 14;
             const floorHeight = 280; 
             const rise = floorHeight / stepCount;
             const isUp3D = type !== 'stairs_down';
             const isHorz = w > h;
             const run = isHorz ? w / stepCount : h / stepCount;
             const stepW = isHorz ? h : w; 

             return (
                 <group position={[0, 0, 0]}>
                     {Array.from({length: stepCount}).map((_, i) => {
                         const yPos = (i * rise) + (rise/2); 
                         let xPos = 0, zPos = 0;
                         let boxArgs: [number, number, number] = [0,0,0];

                         if (isHorz) {
                             // Run along X
                             const stepX = isUp3D ? (-w/2 + (i*run) + run/2) : (w/2 - (i*run) - run/2);
                             xPos = stepX;
                             zPos = 0;
                             boxArgs = [run, rise, stepW];
                         } else {
                             // Run along Z
                             const stepZ = isUp3D ? (-h/2 + (i*run) + run/2) : (h/2 - (i*run) - run/2);
                             xPos = 0;
                             zPos = stepZ;
                             boxArgs = [stepW, rise, run];
                         }

                         return (
                             <mesh key={i} position={[xPos, yPos, zPos]} receiveShadow castShadow>
                                 <boxGeometry args={boxArgs} />
                                 <meshStandardMaterial color="#e2e8f0" />
                                 <Edges color="#94a3b8" />
                             </mesh>
                         )
                     })}
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
};
