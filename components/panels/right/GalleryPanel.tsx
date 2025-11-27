
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useProjectStore } from '../../../store/useProjectStore';
import { useUiStore } from '../../../store/useUiStore';
import { ImageIcon, Trash2, Download, X, Maximize2, Wand2, Clock, Sparkles, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export const GalleryPanel: React.FC = () => {
    const { renders, deleteRender, triggerCanvasRender } = useProjectStore();
    const { setActiveRightPanel } = useUiStore();
    const [previewId, setPreviewId] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);

    const reversedRenders = [...renders].reverse();

    const handleCreateNew = () => {
        triggerCanvasRender();
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        const idx = reversedRenders.findIndex(r => r.id === previewId);
        if (idx < reversedRenders.length - 1) {
            setPreviewId(reversedRenders[idx + 1].id);
            setZoom(1);
        }
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        const idx = reversedRenders.findIndex(r => r.id === previewId);
        if (idx > 0) {
            setPreviewId(reversedRenders[idx - 1].id);
            setZoom(1);
        }
    };

    const closePreview = () => {
        setPreviewId(null);
        setZoom(1);
    };

    useEffect(() => {
        if (!previewId) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                 const idx = reversedRenders.findIndex(r => r.id === previewId);
                 if (idx > 0) {
                     setPreviewId(reversedRenders[idx - 1].id);
                     setZoom(1);
                 }
            }
            if (e.key === 'ArrowRight') {
                 const idx = reversedRenders.findIndex(r => r.id === previewId);
                 if (idx < reversedRenders.length - 1) {
                     setPreviewId(reversedRenders[idx + 1].id);
                     setZoom(1);
                 }
            }
            if (e.key === 'Escape') {
                closePreview();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [previewId, reversedRenders]);

    return (
        <div className="h-full flex flex-col bg-white font-sans">
            {/* Header */}
            <div className="p-6 bg-white border-b border-gray-100 flex flex-col gap-3 shrink-0">
                <div className="flex items-start justify-between">
                     <div className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded">
                        <Sparkles size={12} className="text-black" /> Visualization
                     </div>
                     <button 
                        onClick={() => setActiveRightPanel('library')} 
                        className="text-gray-400 hover:text-black transition-colors bg-transparent hover:bg-gray-100 p-1.5 rounded-full"
                    >
                        <X size={16} />
                    </button>
                </div>
                <div>
                     <h2 className="text-2xl font-black text-black leading-none tracking-tight">Gallery</h2>
                     <p className="text-xs text-gray-500 mt-2 leading-relaxed font-medium">
                        We use AI to create a realistic image of the current drawing.
                     </p>
                </div>
            </div>

            {/* Action Bar */}
            <div className="p-5 border-b border-gray-100 bg-white">
                <button 
                    onClick={handleCreateNew}
                    className="w-full py-3 bg-black text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-md active:scale-95 group"
                >
                    <Wand2 size={16} className="group-hover:rotate-12 transition-transform"/> 
                    Generate New Render
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50">
                {reversedRenders.length === 0 ? (
                     <div className="flex flex-col items-center justify-center text-center py-12 opacity-60">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                            <ImageIcon size={32} />
                        </div>
                        <p className="text-sm font-bold text-gray-500">Gallery Empty</p>
                        <p className="text-xs text-gray-400 mt-1 max-w-[180px]">Your generated images will appear here.</p>
                     </div>
                ) : (
                    reversedRenders.map((render) => (
                        <div key={render.id} className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                             {/* Thumbnail */}
                             <div 
                                className="aspect-video bg-gray-100 relative cursor-pointer overflow-hidden"
                                onClick={() => { setPreviewId(render.id); setZoom(1); }}
                             >
                                 <img src={render.url} alt="Render" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[1px]">
                                     <Maximize2 className="text-white drop-shadow-md" size={24} />
                                 </div>
                             </div>
                             
                             {/* Info */}
                             <div className="p-3 flex items-center justify-between bg-white">
                                 <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
                                     <Clock size={10} />
                                     {new Date(render.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                 </div>
                                 <div className="flex items-center gap-1">
                                     <a 
                                        href={render.url} 
                                        download={`render-${render.id}.png`}
                                        className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md transition-colors"
                                        title="Download"
                                     >
                                         <Download size={14} />
                                     </a>
                                     <button 
                                        onClick={(e) => { e.stopPropagation(); deleteRender(render.id); }}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                        title="Delete"
                                     >
                                         <Trash2 size={14} />
                                     </button>
                                 </div>
                             </div>
                        </div>
                    ))
                )}
            </div>

            {/* Lightbox Portal */}
            {previewId && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-sm flex flex-col animate-fade-in font-sans">
                     {(() => {
                         const img = renders.find(r => r.id === previewId);
                         if (!img) return null;
                         const idx = reversedRenders.findIndex(r => r.id === previewId);
                         const hasNext = idx < reversedRenders.length - 1;
                         const hasPrev = idx > 0;

                         return (
                             <>
                                <div className="h-16 flex items-center justify-between px-6 shrink-0 bg-transparent border-b border-white/10 z-20">
                                     <div className="flex items-center gap-3">
                                         <ImageIcon className="text-white" size={20} />
                                         <span className="text-white text-sm font-bold tracking-wide">FULLSCREEN PREVIEW</span>
                                     </div>
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
                                        <button onClick={closePreview} className="text-white/70 hover:text-white transition-colors p-2 bg-white/10 hover:bg-white/20 rounded-full">
                                            <X size={20} />
                                        </button>
                                     </div>
                                </div>
                                <div className="flex-1 relative flex items-center justify-center bg-transparent overflow-hidden">
                                    {/* Navigation Arrows */}
                                    {hasPrev && (
                                        <button onClick={handlePrev} className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-50 backdrop-blur-md shadow-lg border border-white/10">
                                            <ChevronLeft size={32} />
                                        </button>
                                    )}
                                    
                                    <div className="w-full h-full flex items-center justify-center overflow-auto" style={{ cursor: zoom > 1 ? 'grab' : 'default' }}>
                                        <img 
                                            src={img.url} 
                                            className="transition-transform duration-200 ease-out shadow-2xl rounded-sm" 
                                            style={{ transform: `scale(${zoom})`, maxHeight: '85vh', maxWidth: '85vw', objectFit: 'contain' }}
                                            alt="Full Preview" 
                                        />
                                    </div>
                                    
                                    {hasNext && (
                                        <button onClick={handleNext} className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-50 backdrop-blur-md shadow-lg border border-white/10">
                                            <ChevronRight size={32} />
                                        </button>
                                    )}
                                </div>
                                
                                <div className="h-24 flex items-center justify-center gap-4 shrink-0 pb-6 bg-transparent z-20">
                                    <a href={img.url} download={`render-${img.id}.png`} className="bg-white text-black px-8 py-3 rounded-full font-bold text-sm hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-xl hover:scale-105 transform">
                                        <Download size={18} /> Download High-Res
                                    </a>
                                </div>
                             </>
                         )
                     })()}
                </div>,
                document.body
            )}
        </div>
    );
};
