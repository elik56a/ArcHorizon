
import React, { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUiStore } from '../../store/useUiStore';
import { useTranslation } from '../../hooks/useTranslation';
import { Image as ImageIcon, Download, Maximize2, X, Clock, Wand2, Plus, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export const RenderGallery: React.FC = () => {
    const { t } = useTranslation();
    const { renders, triggerCanvasRender } = useProjectStore();
    const { activeRightPanel, rightPanelOpen, setGalleryOpen } = useUiStore();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);

    const isGalleryOpen = activeRightPanel === 'gallery' && rightPanelOpen;

    if (!isGalleryOpen) return null;

    const reversedRenders = [...renders].reverse();

    const handleNewRender = () => {
        setGalleryOpen(false);
        setTimeout(() => {
            triggerCanvasRender();
        }, 100);
    };

    const closeLightbox = () => {
        setSelectedImage(null);
        setZoom(1);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-8">
            <div className="bg-white w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
                
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <ImageIcon className="text-purple-600" size={24}/> {t('gallery.title')}
                        </h2>
                        <p className="text-sm text-gray-500">{t('gallery.subtitle')}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={handleNewRender}
                            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg shadow-black/20"
                        >
                            <Plus size={16} /> {t('gallery.newRender')}
                        </button>
                        <button 
                            onClick={() => setGalleryOpen(false)}
                            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {reversedRenders.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                            <Wand2 size={64} className="mb-4 opacity-20" />
                            <h3 className="text-lg font-bold text-gray-600 mb-2">{t('gallery.emptyTitle')}</h3>
                            <p className="text-sm max-w-xs mx-auto mb-6">{t('gallery.emptyDesc')}</p>
                            <button 
                                onClick={handleNewRender}
                                className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg text-sm font-bold hover:border-black hover:text-black transition-all"
                            >
                                {t('gallery.createFirst')}
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            {reversedRenders.map((render) => (
                                <div key={render.id} className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                                    <div className="aspect-video bg-gray-100 relative cursor-pointer" onClick={() => { setSelectedImage(render.url); setZoom(1); }}>
                                        <img src={render.url} alt="Render" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <Maximize2 className="text-white drop-shadow-md" size={32} />
                                        </div>
                                    </div>
                                    <div className="p-3 flex justify-between items-center bg-white border-t border-gray-50">
                                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
                                            <Clock size={12} />
                                            {new Date(render.timestamp).toLocaleTimeString()}
                                        </div>
                                        <a 
                                            href={render.url} 
                                            download={`render-${render.id}.png`}
                                            className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                                            title={t('gallery.downloadHighRes')}
                                        >
                                            <Download size={16} />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox Overlay */}
            {selectedImage && (
                <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col animate-fade-in">
                    <div className="h-16 flex items-center justify-between px-6 shrink-0 bg-black/50 backdrop-blur-md border-b border-white/10">
                         <span className="text-white text-sm font-bold font-mono tracking-widest">{t('gallery.fullScreen')}</span>
                         <div className="flex items-center gap-4">
                            <div className="flex items-center bg-white/10 rounded-full p-1">
                                <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} className="p-2 hover:bg-white/20 rounded-full text-white transition-colors" title={t('editor.toolbar.zoomOut')}>
                                    <ZoomOut size={16} />
                                </button>
                                <span className="w-12 text-center text-xs font-mono font-bold text-white">{Math.round(zoom * 100)}%</span>
                                <button onClick={() => setZoom(Math.min(3, zoom + 0.25))} className="p-2 hover:bg-white/20 rounded-full text-white transition-colors" title={t('editor.toolbar.zoomIn')}>
                                    <ZoomIn size={16} />
                                </button>
                                <div className="w-px h-4 bg-white/20 mx-1"></div>
                                <button onClick={() => setZoom(1)} className="p-2 hover:bg-white/20 rounded-full text-white transition-colors" title="Reset Zoom">
                                    <RotateCcw size={14} />
                                </button>
                            </div>
                            <button onClick={closeLightbox} className="text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
                                <X size={24} />
                            </button>
                         </div>
                    </div>
                    <div className="flex-1 p-8 flex items-center justify-center overflow-hidden">
                        <img 
                            src={selectedImage} 
                            className="transition-transform duration-200 ease-out shadow-2xl rounded-sm" 
                            style={{ transform: `scale(${zoom})`, maxHeight: '85vh', maxWidth: '85vw', objectFit: 'contain' }}
                            alt="Full Preview" 
                        />
                    </div>
                    <div className="h-24 flex items-center justify-center gap-4 shrink-0 pb-6 z-20">
                        <a href={selectedImage} download="render-full.png" className="bg-white text-black px-8 py-3 rounded-full font-bold text-sm hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-lg hover:scale-105 transform">
                            <Download size={18} /> {t('gallery.downloadOriginal')}
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};
