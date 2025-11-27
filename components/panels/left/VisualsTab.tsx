
import React, { useState } from 'react';
import { useProjectStore } from '../../../store/useProjectStore';
import { Image as ImageIcon, Download, Maximize2, X, Clock, Wand2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export const VisualsTab: React.FC = () => {
    const { renders } = useProjectStore();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);

    const reversedRenders = [...renders].reverse();

    const closeLightbox = () => {
        setSelectedImage(null);
        setZoom(1);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            {/* Header */}
            <div className="p-4 bg-white border-b border-gray-200">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <ImageIcon size={16} className="text-purple-600"/> Render Gallery
                </h2>
                <p className="text-xs text-gray-500 mt-1">High-fidelity visualizations of your blueprints.</p>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {reversedRenders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-10 text-gray-400">
                        <Wand2 size={48} className="mb-4 opacity-20" />
                        <p className="text-sm font-bold">No renders yet</p>
                        <p className="text-xs max-w-[200px] mt-2">Use the "Magic Render" button in the toolbar to create your first visualization.</p>
                    </div>
                ) : (
                    reversedRenders.map((render) => (
                        <div key={render.id} className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                            <div className="aspect-video bg-gray-100 relative cursor-pointer" onClick={() => { setSelectedImage(render.url); setZoom(1); }}>
                                <img src={render.url} alt="Render" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <Maximize2 className="text-white drop-shadow-md" size={24} />
                                </div>
                            </div>
                            <div className="p-3 flex justify-between items-center bg-white">
                                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
                                    <Clock size={10} />
                                    {new Date(render.timestamp).toLocaleTimeString()}
                                </div>
                                <a 
                                    href={render.url} 
                                    download={`render-${render.id}.png`}
                                    className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Download"
                                >
                                    <Download size={14} />
                                </a>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Lightbox Overlay */}
            {selectedImage && (
                <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col animate-fade-in">
                    <div className="h-16 flex items-center justify-between px-6 shrink-0 z-20 bg-black/50 backdrop-blur">
                         <span className="text-white text-sm font-bold font-mono">FULLSCREEN PREVIEW</span>
                         <div className="flex items-center gap-4">
                            <div className="flex items-center bg-white/10 rounded-full p-1">
                                <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} className="p-2 hover:bg-white/20 rounded-full text-white transition-colors" title="Zoom Out">
                                    <ZoomOut size={16} />
                                </button>
                                <span className="w-12 text-center text-xs font-mono font-bold text-white">{Math.round(zoom * 100)}%</span>
                                <button onClick={() => setZoom(Math.min(3, zoom + 0.25))} className="p-2 hover:bg-white/20 rounded-full text-white transition-colors" title="Zoom In">
                                    <ZoomIn size={16} />
                                </button>
                                <div className="w-px h-4 bg-white/20 mx-1"></div>
                                <button onClick={() => setZoom(1)} className="p-2 hover:bg-white/20 rounded-full text-white transition-colors" title="Reset Zoom">
                                    <RotateCcw size={14} />
                                </button>
                            </div>
                            <button onClick={closeLightbox} className="text-white/70 hover:text-white transition-colors p-2 bg-white/10 hover:bg-white/20 rounded-full">
                                <X size={24} />
                            </button>
                         </div>
                    </div>
                    <div className="flex-1 p-6 flex items-center justify-center overflow-hidden">
                        <img 
                            src={selectedImage} 
                            className="transition-transform duration-200 ease-out shadow-2xl rounded-sm" 
                            style={{ transform: `scale(${zoom})`, maxHeight: '85vh', maxWidth: '85vw', objectFit: 'contain' }}
                            alt="Full Preview" 
                        />
                    </div>
                    <div className="h-20 flex items-center justify-center gap-4 shrink-0 pb-6 z-20">
                        <a href={selectedImage} download="render-full.png" className="bg-white text-black px-6 py-2.5 rounded-full font-bold text-sm hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-lg">
                            <Download size={16} /> Download Original
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};
