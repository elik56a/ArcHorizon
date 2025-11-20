import React from 'react';
import { Triangle, Building2, FileJson, HardHat, Activity, Lock, Shield } from 'lucide-react';

export const EcosystemSection: React.FC = () => {
    return (
        <section id="ecosystem" className="py-32 px-6 bg-[#050505] text-white relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent"></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>
            
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col lg:flex-row gap-20 items-start">
                    
                    {/* Left Column: Typography */}
                    <div className="lg:w-1/2">
                        <div className="flex items-center gap-2 text-blue-500 font-bold mb-8 uppercase tracking-widest text-xs">
                            <Triangle size={10} fill="currentColor" /> Industry Standard
                        </div>
                        
                        <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-8 leading-none">
                            THE FUTURE OF<br/>
                            <span className="text-gray-600">CONSTRUCTION PLANNING.</span>
                        </h2>
                        
                        <p className="text-xl text-gray-400 mb-12 leading-relaxed max-w-lg">
                            From high-rise residential towers to luxury villas. We provide a unified system for Architects, MEP Engineers, and Security Consultants to visualize and coordinate projects from day one.
                        </p>
  
                        <div className="flex gap-6">
                            <button className="bg-white text-black px-8 py-4 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors">
                                Start Planning
                            </button>
                            <button className="border border-white/20 text-white px-8 py-4 rounded-lg font-bold text-sm hover:bg-white/10 transition-colors">
                                View Case Studies
                            </button>
                        </div>
                    </div>
  
                    {/* Right Column: Visual Segments (Cards) */}
                    <div className="lg:w-1/2 grid gap-6">
                        
                        {/* Segment 1: Architectural Vision */}
                        <div className="bg-[#0f0f0f] border border-white/10 p-6 rounded-xl hover:border-white/20 transition-all group cursor-default relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-50 transition-opacity">
                                 <Building2 size={64} />
                            </div>
                            <div className="flex items-start gap-4 relative z-10">
                                 <div className="w-12 h-12 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20 shrink-0">
                                    <FileJson size={24} />
                                 </div>
                                 <div>
                                     <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">Architectural Visualization</h3>
                                     <p className="text-sm text-gray-500 leading-relaxed mb-4">
                                         AI-powered sketching transforms word descriptions or uploaded files into precise 3D models. Validate massing and flow instantly.
                                     </p>
                                 </div>
                            </div>
                        </div>
  
                        {/* Segment 2: MEP Engineering */}
                        <div className="bg-[#0f0f0f] border border-white/10 p-6 rounded-xl hover:border-white/20 transition-all group cursor-default relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-50 transition-opacity">
                                 <HardHat size={64} />
                            </div>
                            <div className="flex items-start gap-4 relative z-10">
                                 <div className="w-12 h-12 rounded-lg bg-yellow-500/10 text-yellow-500 flex items-center justify-center border border-yellow-500/20 shrink-0">
                                    <Activity size={24} />
                                 </div>
                                 <div>
                                     <h3 className="text-lg font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">MEP Coordination</h3>
                                     <p className="text-sm text-gray-500 leading-relaxed">
                                         Dedicated layers for Water and Electricity planning. Detect clashes between structural elements and utility shafts before breaking ground.
                                     </p>
                                 </div>
                            </div>
                        </div>
  
                        {/* Segment 3: Security & Infrastructure */}
                        <div className="bg-[#0f0f0f] border border-white/10 p-6 rounded-xl hover:border-white/20 transition-all group cursor-default relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-50 transition-opacity">
                                 <Shield size={64} />
                            </div>
                            <div className="flex items-start gap-4 relative z-10">
                                 <div className="w-12 h-12 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 shrink-0">
                                    <Lock size={24} />
                                 </div>
                                 <div>
                                     <h3 className="text-lg font-bold text-white mb-2 group-hover:text-red-400 transition-colors">Security Infrastructure</h3>
                                     <p className="text-sm text-gray-500 leading-relaxed">
                                         Plan access control, surveillance coverage, and perimeter security integration directly within the schematic phase.
                                     </p>
                                 </div>
                            </div>
                        </div>
  
                    </div>
                </div>
            </div>
        </section>
    );
};