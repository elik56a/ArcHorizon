
import React from 'react';
import { ArchitecturalElement, ViewStyle } from '../../../types';

interface Render2DProps {
    el: ArchitecturalElement;
    isSelected: boolean;
    viewStyle?: ViewStyle;
}

export const Render2DElement: React.FC<Render2DProps> = ({ el, isSelected, viewStyle }) => {
    const stroke = isSelected ? "#2563eb" : "#000";
    const strokeWidth = isSelected ? 3 : 1.5;
    const detailStroke = 1;
    const { width: w, height: h } = el;

    // Mask Logic: Create a white box larger than the wall to "cut" the wall line visually
    // Increased bleed significantly to cover any wall fragments
    const MASK_BLEED = 30; 
    const maskW = w + MASK_BLEED;
    const maskH = h + MASK_BLEED;
    const maskX = -MASK_BLEED / 2;
    const maskY = -MASK_BLEED / 2;

    const content = (() => {
        switch (el.type) {
            case 'wall_opening':
                return (
                    <g>
                        {/* Strong White Mask to hide wall */}
                        <rect x={maskX} y={maskY} width={maskW} height={maskH} fill="white" stroke="none" />
                        <line x1={0} y1={0} x2={0} y2={h} stroke="#ccc" strokeWidth={1} strokeDasharray="2,2" />
                        <line x1={w} y1={0} x2={w} y2={h} stroke="#ccc" strokeWidth={1} strokeDasharray="2,2" />
                        {isSelected && <rect x={0} y={0} width={w} height={h} fill="rgba(37, 99, 235, 0.1)" stroke="#2563eb" strokeWidth={1} strokeDasharray="4,4" />}
                    </g>
                );

            case 'window':
                return (
                    <g>
                        <rect x={maskX} y={maskY} width={maskW} height={maskH} fill="white" stroke="none" />
                        <rect x={0} y={0} width={w} height={h} fill="white" stroke={stroke} strokeWidth={1.5} />
                        <line x1={0} y1={h/2} x2={w} y2={h/2} stroke={stroke} strokeWidth={0.5} />
                        <rect x={0} y={0} width={3} height={h} fill={stroke} />
                        <rect x={w-3} y={0} width={3} height={h} fill={stroke} />
                    </g>
                );

            case 'entry_door':
                // Visual Clamp for Door Size (prevent huge artifacts if data is bad)
                const dw_e = Math.min(w, 150); 
                return (
                    <g>
                        <rect x={maskX} y={maskY} width={maskW} height={maskH} fill="white" stroke="none" />
                        {/* Frame */}
                        <rect x={0} y={0} width={5} height={h} fill="white" stroke={stroke} strokeWidth={strokeWidth} />
                        <rect x={w-5} y={0} width={5} height={h} fill="white" stroke={stroke} strokeWidth={strokeWidth} />
                        {/* Door Slab */}
                        <rect x={0} y={0} width={5} height={dw_e} fill="white" stroke={stroke} strokeWidth={strokeWidth} />
                        {/* Swing Arc */}
                        <path d={`M 5 ${dw_e} A ${dw_e} ${dw_e} 0 0 0 ${dw_e} ${h}`} fill="none" stroke={stroke} strokeWidth={detailStroke} strokeDasharray="4,4" />
                        {/* Entry Arrow */}
                        <path d={`M ${w/2} -30 L ${w/2} -5 M ${w/2 - 5} -15 L ${w/2} -5 L ${w/2 + 5} -15`} stroke="black" strokeWidth={2} fill="none" />
                    </g>
                );

            case 'door':
            case 'door_internal' as any:
            case 'internal_door' as any:
                // Visual Clamp for Door Size (standard internal door ~80-90cm)
                // If the geometry engine produced a huge width, we clamp the visual swing to 100cm max
                // to avoid the "huge door" artifact covering the room.
                const dw = Math.min(w, 100);
                return (
                    <g>
                        <rect x={maskX} y={maskY} width={maskW} height={maskH} fill="white" stroke="none" />
                        <rect x={0} y={0} width={4} height={h} fill="white" stroke={stroke} strokeWidth={1} />
                        <rect x={w-4} y={0} width={4} height={h} fill="white" stroke={stroke} strokeWidth={1} />
                        {/* Door Slab - Use clamped width */}
                        <rect x={0} y={0} width={4} height={dw} fill="white" stroke={stroke} strokeWidth={strokeWidth} />
                        {/* Swing Arc - Use clamped width */}
                        <path d={`M 4 ${dw} A ${dw} ${dw} 0 0 0 ${dw} ${h}`} fill="none" stroke={stroke} strokeWidth={detailStroke} />
                    </g>
                );

            case 'sliding_door':
                 return (
                     <g>
                        <rect x={maskX} y={maskY} width={maskW} height={maskH} fill="white" stroke="none" />
                        <line x1={0} y1={h/2} x2={w} y2={h/2} stroke={stroke} strokeWidth={0.5} />
                        <rect x={0} y={h/2 - 2} width={w/2 + 2} height={4} fill="white" stroke={stroke} strokeWidth={1.5} />
                        <rect x={w/2 - 2} y={h/2 - 2} width={w/2 + 2} height={4} fill="white" stroke={stroke} strokeWidth={1.5} transform={`translate(0, ${4})`} />
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
                        <rect x={0} y={0} width={w} height={h} fill="white" stroke={stroke} strokeWidth={strokeWidth} />
                        {Array.from({length: numSteps}).map((_, i) => {
                             if (isHorizontal) {
                                 return <line key={i} x1={i * (w/numSteps)} y1={0} x2={i * (w/numSteps)} y2={h} stroke={stroke} strokeWidth={1} opacity={0.5} />
                             } else {
                                 return <line key={i} x1={0} y1={i * (h/numSteps)} x2={w} y2={i * (h/numSteps)} stroke={stroke} strokeWidth={1} opacity={0.5} />
                             }
                        })}
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
                        <circle cx={w/2} cy={h/2} r={Math.min(w,h)/2} fill="none" stroke="#166534" strokeWidth={1.5} strokeDasharray="4,2" />
                        <circle cx={w/2} cy={h/2} r={2} fill="#166534" />
                        <circle cx={w/2 + w*0.2} cy={h/2 - h*0.1} r={Math.min(w,h)/4} fill="none" stroke="#166534" strokeWidth={1} />
                    </g>
                );
            
            case 'parking': 
            case 'car':
                 return (
                    <g>
                        <rect x={w*0.15} y={0} width={w*0.7} height={h} rx={8} fill="white" stroke={stroke} strokeWidth={strokeWidth} />
                        <path d={`M ${w*0.2} ${h*0.22} L ${w*0.8} ${h*0.22} Q ${w*0.82} ${h*0.3} ${w*0.85} ${h*0.35} L ${w*0.15} ${h*0.35} Q ${w*0.18} ${h*0.3} ${w*0.2} ${h*0.22} Z`} fill="#f3f4f6" stroke={stroke} strokeWidth={1} />
                        <path d={`M ${w*0.2} ${h*0.82} L ${w*0.8} ${h*0.82} Q ${w*0.82} ${h*0.75} ${w*0.85} ${h*0.7} L ${w*0.15} ${h*0.7} Q ${w*0.18} ${h*0.75} ${w*0.2} ${h*0.82} Z`} fill="#f3f4f6" stroke={stroke} strokeWidth={1} />
                        <rect x={w*0.18} y={h*0.35} width={w*0.64} height={h*0.35} fill="white" stroke={stroke} strokeWidth={0.5} />
                        <line x1={w*0.2} y1={h*0.05} x2={w*0.2} y2={h*0.2} stroke={stroke} strokeWidth={0.5} opacity={0.5}/>
                        <line x1={w*0.8} y1={h*0.05} x2={w*0.8} y2={h*0.2} stroke={stroke} strokeWidth={0.5} opacity={0.5}/>
                        <path d={`M ${w*0.2} 2 L ${w*0.3} 2 L ${w*0.3} 8 L ${w*0.2} 8 Z`} fill={stroke} />
                        <path d={`M ${w*0.7} 2 L ${w*0.8} 2 L ${w*0.8} 8 L ${w*0.7} 8 Z`} fill={stroke} />
                        <rect x={w*0.1} y={h*0.25} width={w*0.05} height={h*0.05} fill={stroke} />
                        <rect x={w*0.85} y={h*0.25} width={w*0.05} height={h*0.05} fill={stroke} />
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
                        <rect x={0} y={0} width={w} height={h * 0.15} fill="none" stroke={stroke} strokeWidth={detailStroke} />
                        <rect x={w * 0.1} y={h * 0.05} width={w * 0.35} height={h * 0.15} rx={2} fill="white" stroke={stroke} strokeWidth={detailStroke} />
                        {el.type !== 'bed_single' && (
                            <rect x={w * 0.55} y={h * 0.05} width={w * 0.35} height={h * 0.15} rx={2} fill="white" stroke={stroke} strokeWidth={detailStroke} />
                        )}
                        <path d={`M 0 ${h*0.35} Q ${w/2} ${h*0.4} ${w} ${h*0.35} L ${w} ${h} L 0 ${h} Z`} fill="none" stroke={stroke} strokeWidth={detailStroke} />
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
                        <path d={`M ${w*0.15} ${h*0.3} L ${w*0.85} ${h*0.3} L ${w*0.85} ${h*0.7} Q ${w*0.85} ${h} ${w*0.5} ${h} Q ${w*0.15} ${h} ${w*0.15} ${h*0.7} Z`} fill="white" stroke={stroke} strokeWidth={strokeWidth} />
                    </g>
                 );
                 
            case 'sink_single':
            case 'sink_double':
                 return (
                     <g>
                         <rect x={0} y={0} width={w} height={h} fill="white" stroke={stroke} strokeWidth={strokeWidth} />
                         <rect x={w*0.1} y={h*0.1} width={el.type === 'sink_double' ? w*0.35 : w*0.8} height={h*0.8} rx={5} fill="none" stroke={stroke} strokeWidth={1} />
                         {el.type === 'sink_double' && <rect x={w*0.55} y={h*0.1} width={w*0.35} height={h*0.8} rx={5} fill="none" stroke={stroke} strokeWidth={1} />}
                         <circle cx={w/2} cy={h*0.9} r={2} fill={stroke} />
                     </g>
                 );

            case 'shower':
                 return (
                     <g>
                         <rect x={0} y={0} width={w} height={h} fill="white" stroke={stroke} strokeWidth={strokeWidth} />
                         <line x1={0} y1={0} x2={w} y2={h} stroke={stroke} strokeWidth={0.5} />
                         <line x1={w} y1={0} x2={0} y2={h} stroke={stroke} strokeWidth={0.5} />
                         <circle cx={w/2} cy={h/2} r={3} fill="white" stroke={stroke} />
                     </g>
                 );

            case 'bathtub':
                 return (
                     <g>
                         <rect x={0} y={0} width={w} height={h} fill="white" stroke={stroke} strokeWidth={strokeWidth} />
                         <rect x={w*0.1} y={h*0.1} width={w*0.8} height={h*0.8} rx={15} fill="none" stroke={stroke} strokeWidth={1} />
                         <circle cx={w*0.5} cy={h*0.2} r={3} fill={stroke} />
                     </g>
                 );
            
            case 'dining_table':
            case 'table':
                 return (
                     <g>
                         <rect x={0} y={0} width={w} height={h} fill="white" stroke={stroke} strokeWidth={strokeWidth} />
                         <rect x={w*0.1} y={-10} width={w*0.2} height={10} fill="none" stroke={stroke} strokeWidth={1} />
                         <rect x={w*0.7} y={-10} width={w*0.2} height={10} fill="none" stroke={stroke} strokeWidth={1} />
                         <rect x={w*0.1} y={h} width={w*0.2} height={10} fill="none" stroke={stroke} strokeWidth={1} />
                         <rect x={w*0.7} y={h} width={w*0.2} height={10} fill="none" stroke={stroke} strokeWidth={1} />
                     </g>
                 );
            
            case 'stove':
                 return (
                     <g>
                         <rect x={0} y={0} width={w} height={h} fill="white" stroke={stroke} strokeWidth={strokeWidth} />
                         <circle cx={w*0.25} cy={h*0.25} r={w*0.15} fill="none" stroke={stroke} strokeWidth={1} />
                         <circle cx={w*0.75} cy={h*0.25} r={w*0.15} fill="none" stroke={stroke} strokeWidth={1} />
                         <circle cx={w*0.25} cy={h*0.75} r={w*0.15} fill="none" stroke={stroke} strokeWidth={1} />
                         <circle cx={w*0.75} cy={h*0.75} r={w*0.15} fill="none" stroke={stroke} strokeWidth={1} />
                     </g>
                 );

            default:
                return (
                    <g>
                        <rect x={0} y={0} width={w} height={h} fill="white" stroke={stroke} strokeWidth={strokeWidth} />
                        <line x1={0} y1={0} x2={w} y2={h} stroke={stroke} strokeWidth={0.5} />
                        <line x1={w} y1={0} x2={0} y2={h} stroke={stroke} strokeWidth={0.5} />
                    </g>
                );
        }
    })();

    return (
        <g>
            {content}
        </g>
    );
};
