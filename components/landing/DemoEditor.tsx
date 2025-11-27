
import React, { useState, useRef } from 'react';
import { SketchData } from '../../types';
import Canvas3D from '../blueprint/3d/Canvas3D';
import Canvas2D from '../blueprint/2d/Canvas2D';
import { RotatingHouse } from './RotatingHouse';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import { Loader2, Layers, MousePointer2, Maximize, Box } from 'lucide-react';

interface DemoEditorProps {
    data: SketchData;
    isLoading: boolean;
}

export const DemoEditor: React.FC<DemoEditorProps> = ({ data, isLoading }) => {
    const [view, setView] = useState<'2d' | '3d'>('3d');
    const [activeFloor, setActiveFloor] = useState(1);
    // DEFAULT: Show Whole Building in 3D
    const [showWholeBuilding, setShowWholeBuilding] = useState(true); 
    const containerRef = useRef<HTMLDivElement>(null);

    // 2D Interaction State
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(0.4); // Start zoomed out
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    // 2D Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if(view === '3d') return;
        e.preventDefault();
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isPanning || view === '3d') return;
        setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    };

    const handleMouseUp = () => setIsPanning(false);

    const handleWheel = (e: React.WheelEvent) => {
        if(view === '3d') return;
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale(s => Math.min(Math.max(s * delta, 0.1), 3));
    };

    return (
        <div className="w-full max-w-6xl mx-auto h-[700px] bg-white rounded-xl border-2 border-black shadow-[0px_30px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col relative animate-slide-up transition-all" style={{ animationDelay: '0.2s' }}>
            
            {/* Beautiful 3D Loading Overlay */}
            {isLoading && (
                <div className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center animate-fade-in">
                    <div className="w-full h-64 mb-4">
                        <Canvas camera={{ position: [4, 3, 4], fov: 45 }}>
                             <ambientLight intensity={0.8} />
                             <directionalLight position={[2, 5, 2]} />
                             <RotatingHouse />
                             <Environment preset="city" />
                        </Canvas>
                    </div>
                    <div className="flex flex-col items-center gap-3 relative z-10">
                        <div className="flex items-center gap-2 text-black">
                            <Loader2 className="animate-spin" size={20}/>
                            <span className="font-mono font-bold text-xl tracking-widest uppercase">Constructing Model</span>
                        </div>
                        <div className="flex flex-col items-center space-y-1">
                            <p className="text-gray-400 text-xs font-mono uppercase tracking-wide animate-pulse">Solving Constraints...</p>
                            <div className="w-32 h-1 bg-gray-100 rounded-full overflow-hidden mt-2">
                                <div className="h-full bg-black animate-[progress_1.5s_ease-in-out_infinite] w-1/3"></div>
                            </div>
                        </div>
                    </div>
                    {/* Grid Background for Loader */}
                    <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                </div>
            )}

            {/* Toolbar */}
            <div className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-200 hover:bg-red-400 transition-colors"></div>
                        <div className="w-3 h-3 rounded-full bg-gray-200 hover:bg-yellow-400 transition-colors"></div>
                        <div className="w-3 h-3 rounded-full bg-gray-200 hover:bg-green-400 transition-colors"></div>
                    </div>
                    <div className="h-6 w-px bg-gray-200"></div>
                    <span className="text-xs font-mono font-bold text-black uppercase tracking-wide">
                        {data.title} <span className="text-gray-400">// PREVIEW</span>
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    {/* View Toggle */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button 
                            onClick={() => setView('2d')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${view === '2d' ? 'bg-white text-black shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-black'}`}
                        >
                            2D PLAN
                        </button>
                        <button 
                            onClick={() => setView('3d')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${view === '3d' ? 'bg-white text-black shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-black'}`}
                        >
                            3D MODEL
                        </button>
                    </div>

                    {/* Floor Toggle & Layer Stack */}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">LEVEL</span>
                        <div className="flex gap-1">
                            {Array.from({length: data.floors || 1}, (_, i) => i + 1).map(f => (
                                <button 
                                    key={f}
                                    onClick={() => { setActiveFloor(f); setShowWholeBuilding(false); }}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all ${activeFloor === f && !showWholeBuilding ? 'bg-black text-white border-black' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                >
                                    {f}
                                </button>
                            ))}
                            
                            {/* 3D Whole Building Toggle */}
                            {view === '3d' && (
                                <button 
                                    onClick={() => setShowWholeBuilding(!showWholeBuilding)}
                                    title="Toggle Whole Building View"
                                    className={`w-8 h-8 ml-1 flex items-center justify-center rounded-lg text-xs font-bold border transition-all ${showWholeBuilding ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                >
                                    <Layers size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Canvas */}
            <div 
                ref={containerRef}
                className={`flex-1 relative bg-[#f5f5f5] overflow-hidden ${view === '2d' && isPanning ? 'cursor-grabbing' : view === '2d' ? 'cursor-grab' : ''}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
            >
                {view === '3d' ? (
                    <Canvas3D 
                        data={data} 
                        activeFloor={activeFloor} 
                        showAllFloors={showWholeBuilding} // Controlled by the new toggle
                    />
                ) : (
                    <Canvas2D 
                        svgRef={null as any}
                        data={data} 
                        activeFloor={activeFloor}
                        pan={pan} 
                        scale={scale} 
                        rotation={0}
                        bounds={{ minX: 0, maxX: 2000, minY: 0, maxY: 2000 }}
                        onMouseDown={() => {}} // Handled by container for preview panning
                        onMouseMove={() => {}}
                        onMouseUp={() => {}}
                        onWheel={() => {}}
                    />
                )}
                
                {/* Legend / Controls Overlay */}
                <div className="absolute bottom-6 left-6 pointer-events-none">
                    <div className="bg-white/90 backdrop-blur px-4 py-3 rounded-xl border border-white/50 shadow-sm">
                         <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
                             <div className="flex items-center gap-1"><MousePointer2 size={14}/> PAN</div>
                             <div className="flex items-center gap-1"><Maximize size={14}/> ZOOM</div>
                             <div className="flex items-center gap-1"><Box size={14}/> ROTATE</div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
