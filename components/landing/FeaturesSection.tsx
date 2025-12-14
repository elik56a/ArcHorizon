
import React from 'react';
import { Cuboid, Hammer, Download, Layers, Workflow, Zap, Droplets, Shield } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export const FeaturesSection: React.FC = () => {
    const { t } = useTranslation();

    return (
        <section id="features" className="py-32 px-6 bg-white relative border-t border-gray-100">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <div className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-widest text-black uppercase bg-gray-100 rounded-full">{t('landing.features.label')}</div>
                    <h2 className="text-4xl font-black tracking-tight mb-4">{t('landing.features.title')}</h2>
                    <p className="text-gray-500 max-w-2xl mx-auto text-lg">
                        {t('landing.features.subtitle')}
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    
                    {/* 1. 2D/3D Toggle */}
                    <div className="bg-gray-50 rounded-2xl p-8 border border-transparent hover:border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-default">
                        <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 flex items-center justify-center mb-6 text-black shadow-sm group-hover:scale-110 transition-transform">
                            <Cuboid size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 group-hover:text-blue-600 transition-colors">{t('landing.features.dualView.title')}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            {t('landing.features.dualView.desc')}
                        </p>
                    </div>

                    {/* 2. Smart Elements */}
                    <div className="bg-gray-50 rounded-2xl p-8 border border-transparent hover:border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-default">
                        <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 flex items-center justify-center mb-6 text-black shadow-sm group-hover:scale-110 transition-transform">
                            <Hammer size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 group-hover:text-blue-600 transition-colors">{t('landing.features.smartAssembly.title')}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            {t('landing.features.smartAssembly.desc')}
                        </p>
                    </div>

                    {/* 3. Export */}
                    <div className="bg-gray-50 rounded-2xl p-8 border border-transparent hover:border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-default">
                        <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 flex items-center justify-center mb-6 text-black shadow-sm group-hover:scale-110 transition-transform">
                            <Download size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 group-hover:text-blue-600 transition-colors">{t('landing.features.productionReady.title')}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            {t('landing.features.productionReady.desc')}
                        </p>
                    </div>

                    {/* 4. Revit Integration (New) */}
                    <div className="bg-gray-900 text-white rounded-2xl p-8 border border-transparent hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded uppercase">{t('landing.features.bim.comingSoon')}</div>
                        <div className="w-12 h-12 bg-white/10 rounded-xl border border-white/10 flex items-center justify-center mb-6 text-white shadow-sm group-hover:scale-110 transition-transform">
                            <Layers size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3">{t('landing.features.bim.title')}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            {t('landing.features.bim.desc')}
                        </p>
                    </div>

                    {/* 5. MEP Layers (Double width) */}
                    <div className="bg-gray-50 rounded-2xl p-8 border border-transparent hover:border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group md:col-span-2 cursor-default">
                        <div className="flex flex-col md:flex-row items-start gap-6">
                            <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 flex items-center justify-center shrink-0 text-purple-600 shadow-sm group-hover:scale-110 transition-transform">
                                <Workflow size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-3 group-hover:text-purple-600 transition-colors">{t('landing.features.mep.title')}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                                    {t('landing.features.mep.desc')}
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg shadow-sm">
                                        <Zap size={12} className="text-yellow-500 fill-yellow-500"/> {t('landing.features.mep.elec')}
                                    </span>
                                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg shadow-sm">
                                        <Droplets size={12} className="text-blue-500 fill-blue-500"/> {t('landing.features.mep.plumb')}
                                    </span>
                                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg shadow-sm">
                                        <Shield size={12} className="text-red-500 fill-red-500"/> {t('landing.features.mep.security')}
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
