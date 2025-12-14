
import React from 'react';
import { Share2, MessageSquare } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export const Footer: React.FC = () => {
    const { t } = useTranslation();

    return (
        <footer className="bg-white text-black pt-32 pb-12 border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 mb-20">
                <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-bold text-lg rounded-lg">A</div>
                        <span className="font-bold text-2xl tracking-tight">ArcHorizon</span>
                    </div>
                    <p className="text-gray-500 max-w-sm mb-8 text-lg leading-relaxed">
                        {t('landing.footer.desc')}
                    </p>
                    <div className="flex gap-4">
                        <div className="w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition-all cursor-pointer"><Share2 size={18}/></div>
                        <div className="w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition-all cursor-pointer"><MessageSquare size={18}/></div>
                    </div>
                </div>
                
                <div>
                    <h4 className="font-bold mb-8 text-lg">{t('landing.footer.product')}</h4>
                    <ul className="space-y-4 text-gray-500 font-medium">
                        <li className="hover:text-black cursor-pointer transition-colors">{t('landing.footer.features')}</li>
                        <li className="hover:text-black cursor-pointer transition-colors">{t('landing.footer.pricing')}</li>
                        <li className="hover:text-black cursor-pointer transition-colors">{t('landing.footer.enterprise')}</li>
                        <li className="hover:text-black cursor-pointer transition-colors">{t('landing.footer.changelog')}</li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold mb-8 text-lg">{t('landing.footer.legal')}</h4>
                    <ul className="space-y-4 text-gray-500 font-medium">
                        <li className="hover:text-black cursor-pointer transition-colors">{t('landing.footer.privacy')}</li>
                        <li className="hover:text-black cursor-pointer transition-colors">{t('landing.footer.terms')}</li>
                        <li className="hover:text-black cursor-pointer transition-colors">{t('landing.footer.security')}</li>
                    </ul>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 font-medium">
                <p>{t('landing.footer.rights')}</p>
                <div className="flex items-center gap-2 mt-4 md:mt-0">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>{t('landing.footer.status')}</span>
                </div>
            </div>
        </footer>
    );
};
