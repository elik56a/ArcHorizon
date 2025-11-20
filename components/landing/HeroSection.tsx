import React, { useRef } from 'react';
import { Sparkles, Terminal, Loader2 } from 'lucide-react';
import { SketchData } from '../../types';
import { DemoEditor } from './DemoEditor';
import { RotatingHouse } from './RotatingHouse';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';

interface HeroSectionProps {
    input: string;
    isGenerating: boolean;
    hasGenerated: boolean;
    previewData: SketchData;
    onGenerate: (e: React.FormEvent | React.KeyboardEvent) => void;
    demoSectionRef: React.RefObject<HTMLDivElement | null>;
}

// --- BACKGROUND ---
const HeroBackground = () => {
    return (
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden bg-[#fdfbf7]">
             {/* Blueprint Grid */}
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:40px_40px]"></div>
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:200px_200px]"></div>
        </div>
    );
};

export const HeroSection: React.FC<HeroSectionProps> = ({ 
    input, isGenerating, hasGenerated, previewData, onGenerate, demoSectionRef 
}) => {
    return (
        <section className="relative pt-32 pb-32 px-6 flex flex-col items-center overflow-visible">
            <HeroBackground />
            
            <div className="relative z-10 max-w-6xl mx-auto w-full text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wide mb-10 animate-fade-in shadow-sm">
                   <Sparkles size={14} className="text-blue-600" /> Generative Design Suite v1.5
                </div>
                
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.95] mb-10 animate-slide-up text-black">
                   DESIGN AT THE<br/>
                   <span className="text-gray-300">SPEED OF THOUGHT</span>
                </h1>
                
                <p className="text-2xl text-gray-500 max-w-2xl mx-auto mb-12 font-medium leading-relaxed animate-slide-up font-sans" style={{ animationDelay: '0.1s' }}>
                    The world's first AI copilot for schematic design.
                    <br/>Transform text into CAD-ready blueprints instantly. 
                </p>
   
                {/* MAGIC INPUT - READ ONLY & HIGHER */}
                {/* ADDED HUGE MARGIN BOTTOM HERE AS REQUESTED */}
                <div className="max-w-3xl mx-auto mb-48 animate-slide-up relative z-30" style={{ animationDelay: '0.15s' }}>
                    <div className="relative group">
                        <div className="relative flex flex-col bg-white rounded-3xl border border-gray-200 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] p-2 focus-within:border-black focus-within:ring-4 focus-within:ring-black/5 transition-all overflow-hidden">
                            <div className="flex items-start w-full">
                                <div className="pl-5 pr-4 py-4 text-black">
                                    <Terminal size={24} />
                                </div>
                                <textarea 
                                   value={input}
                                   readOnly
                                   onKeyDown={(e) => { if(e.key === 'Enter') onGenerate(e); }}
                                   className="flex-1 min-h-[100px] outline-none text-lg font-medium bg-transparent text-gray-800 placeholder:text-gray-300 cursor-default resize-none py-4 leading-relaxed"
                                />
                            </div>
                            <div className="flex justify-between items-center px-4 pb-3 border-t border-gray-50 pt-2 mt-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Read Only Mode</span>
                                <button 
                                    onClick={onGenerate}
                                    disabled={isGenerating || hasGenerated}
                                    className="bg-black text-white h-10 px-6 rounded-lg font-bold text-sm hover:bg-gray-900 transition-all active:scale-95 flex items-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                                    Generate
                                </button>
                            </div>
                        </div>
                        {/* Helper hint */}
                        <div className="absolute -right-24 top-1/2 -translate-y-1/2 hidden xl:block text-gray-400 text-xs font-mono transform rotate-90">
                           Press &lt;Enter&gt;
                        </div>
                    </div>
                </div>
   
                {/* SPACER + ROTATING PREVIEW or DEMO */}
                <div ref={demoSectionRef} id="demo-section" className="w-full max-w-6xl mx-auto px-4 md:px-0 relative mt-8 min-h-[700px] flex flex-col items-center justify-center scroll-mt-20">
                    
                    {!hasGenerated ? (
                        // THE "BEFORE" STATE: Modern 3D Viewport Frame
                        <div className="flex flex-col items-center justify-center animate-fade-in w-full h-full">
                           <div className="relative group w-full h-full" title="Interactive Preview">
                               {/* Decorative Frame around Animation - EXACTLY 700PX */}
                               <div className="w-full h-[700px] bg-gray-50 rounded-xl border-2 border-gray-200 shadow-[0px_20px_40px_-10px_rgba(0,0,0,0.1)] flex items-center justify-center relative overflow-hidden hover:border-black/20 transition-all">
                                   <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
                                   
                                   {/* Fake UI Chrome */}
                                   <div className="absolute top-0 left-0 right-0 h-8 bg-white border-b border-gray-100 flex items-center justify-between px-3 z-10">
                                       <div className="flex gap-1.5">
                                           <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                                           <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                                           <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                                       </div>
                                       <div className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider">Viewport [Persp]</div>
                                       <div className="w-4"></div>
                                   </div>
   
                                   {/* 3D Canvas */}
                                   <div className="w-full h-full mt-8">
                                       <Canvas camera={{ position: [5, 4, 5], fov: 40 }} shadows>
                                           <ambientLight intensity={0.7} />
                                           <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
                                           <ContactShadows position={[0, -0.6, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
                                           <Environment preset="city" />
                                           <RotatingHouse />
                                       </Canvas>
                                   </div>
                                   
                                   {/* Call to Action Overlay */}
                                   <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
                                       <p className="text-sm font-mono font-bold text-blue-600 uppercase tracking-widest animate-pulse bg-white/80 backdrop-blur px-3 py-1 rounded-full border border-blue-100">
                                           Press Enter to Visualize
                                       </p>
                                   </div>
                               </div>
                           </div>
                        </div>
                    ) : (
                        // THE "AFTER" STATE: Actual Editor
                        <div className="w-full h-[700px] animate-fade-in">
                           <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-green-50 text-green-700 px-5 py-2 rounded-full text-sm font-bold border border-green-200 shadow-sm z-20 flex items-center gap-2">
                               <Sparkles size={16}/> Generation Complete
                           </div>
                           <DemoEditor 
                               data={previewData} 
                               isLoading={isGenerating} 
                           />
                        </div>
                    )}
                </div>
   
            </div>
        </section>
    );
};