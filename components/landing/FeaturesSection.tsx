import React from 'react';
import { Cuboid, Hammer, Download, Layers, Workflow, Zap, Droplets, Shield } from 'lucide-react';

export const FeaturesSection: React.FC = () => {
    return (
        <section id="features" className="py-32 px-6 bg-white relative border-t border-gray-100">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <div className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-widest text-black uppercase bg-gray-100 rounded-full">Capabilities</div>
                    <h2 className="text-4xl font-black tracking-tight mb-4">Everything You Need to Build</h2>
                    <p className="text-gray-500 max-w-2xl mx-auto text-lg">
                        A complete suite of tools bridging the gap between imagination and realization.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    
                    {/* 1. 2D/3D Toggle */}
                    <div className="bg-gray-50 rounded-2xl p-8 border border-transparent hover:border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-default">
                        <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 flex items-center justify-center mb-6 text-black shadow-sm group-hover:scale-110 transition-transform">
                            <Cuboid size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 group-hover:text-blue-600 transition-colors">Dual-View Engine</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Instantly toggle between technical 2D floor plans and immersive 3D models. Visualize spatial volume and flow without switching software.
                        </p>
                    </div>

                    {/* 2. Smart Elements */}
                    <div className="bg-gray-50 rounded-2xl p-8 border border-transparent hover:border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-default">
                        <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 flex items-center justify-center mb-6 text-black shadow-sm group-hover:scale-110 transition-transform">
                            <Hammer size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 group-hover:text-blue-600 transition-colors">Smart Assembly</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Drag-and-drop intelligent architectural components. Walls auto-heal, doors cut openings, and rooms calculate their own area dynamically.
                        </p>
                    </div>

                    {/* 3. Export */}
                    <div className="bg-gray-50 rounded-2xl p-8 border border-transparent hover:border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-default">
                        <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 flex items-center justify-center mb-6 text-black shadow-sm group-hover:scale-110 transition-transform">
                            <Download size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 group-hover:text-blue-600 transition-colors">Production Ready</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Export clean, layer-separated DXF files for AutoCAD, or generate high-res PDFs and SVGs for client presentations and permit sets.
                        </p>
                    </div>

                    {/* 4. Revit Integration (New) */}
                    <div className="bg-gray-900 text-white rounded-2xl p-8 border border-transparent hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded uppercase">Coming Soon</div>
                        <div className="w-12 h-12 bg-white/10 rounded-xl border border-white/10 flex items-center justify-center mb-6 text-white shadow-sm group-hover:scale-110 transition-transform">
                            <Layers size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3">BIM & Revit Sync</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Seamless interoperability. Convert your schematic sketches directly into BIM families and massing models in Revit or Rhino.
                        </p>
                    </div>

                    {/* 5. MEP Layers (Double width) */}
                    <div className="bg-gray-50 rounded-2xl p-8 border border-transparent hover:border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group md:col-span-2 cursor-default">
                        <div className="flex flex-col md:flex-row items-start gap-6">
                            <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 flex items-center justify-center shrink-0 text-purple-600 shadow-sm group-hover:scale-110 transition-transform">
                                <Workflow size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-3 group-hover:text-purple-600 transition-colors">Integrated MEP Systems</h3>
                                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                                    Plan infrastructure early. Visualize and manage technical layers beyond just walls to avoid clashes during construction documentation.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg shadow-sm">
                                        <Zap size={12} className="text-yellow-500 fill-yellow-500"/> Electrical
                                    </span>
                                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg shadow-sm">
                                        <Droplets size={12} className="text-blue-500 fill-blue-500"/> Plumbing
                                    </span>
                                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg shadow-sm">
                                        <Shield size={12} className="text-red-500 fill-red-500"/> Security
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};