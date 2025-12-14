
import React, { useState, useRef, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Globe, ChevronDown, Check, Menu, X } from 'lucide-react';
import { useLanguageStore, Language } from '../../store/useLanguageStore';
import { useTranslation } from '../../hooks/useTranslation';

const { Link } = ReactRouterDOM as any;

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const NavLink: React.FC<NavLinkProps> = ({ to, children, onClick, className = "" }) => (
    <Link 
        to={to} 
        onClick={onClick}
        className={`text-sm font-bold text-gray-500 hover:text-black transition-colors font-mono uppercase tracking-tight ${className}`}
    >
        {children}
    </Link>
);

const LanguageMenu = () => {
    const { language, setLanguage } = useLanguageStore();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const languages: { code: Language; label: string; icon: string }[] = [
        { code: 'en', label: 'English', icon: '🇺🇸' },
        { code: 'he', label: 'עברית', icon: '🇮🇱' }
    ];

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-black transition-colors"
            >
                <Globe size={16} />
                <span className="uppercase">{language}</span>
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 rtl:right-auto rtl:left-0 mt-2 w-40 bg-white border border-gray-200 shadow-xl rounded-xl p-1 z-50 animate-fade-in">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => { setLanguage(lang.code); setIsOpen(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${language === lang.code ? 'bg-gray-100 text-black font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <span className="text-lg">{lang.icon}</span>
                            <span className="flex-1 text-start">{lang.label}</span>
                            {language === lang.code && <Check size={14} className="text-blue-600"/>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export const Navbar: React.FC = () => {
    const { t } = useTranslation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-xl border-b border-gray-100 z-50 transition-all">
            <div className="max-w-7xl mx-auto px-6 md:px-8 h-20 flex items-center justify-between">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo(0,0)}>
                    <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-bold font-mono text-xl rounded-lg shadow-lg group-hover:rotate-90 transition-transform duration-500">A</div>
                    <span className="font-bold text-xl tracking-tight">ArcHorizon</span>
                </div>
                
                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-10">
                    <NavLink to="#features">{t('landing.nav.platform')}</NavLink>
                    <NavLink to="#ecosystem">{t('landing.nav.ecosystem')}</NavLink>
                    <NavLink to="#pricing">{t('landing.nav.pricing')}</NavLink>
                </div>

                {/* Desktop Right */}
                <div className="hidden md:flex items-center gap-6">
                    <LanguageMenu />
                    <div className="h-4 w-px bg-gray-200"></div>
                    <Link to="/login" className="text-sm font-bold text-gray-600 hover:text-black transition-colors">{t('landing.nav.logIn')}</Link>
                    <Link to="/signup">
                        <button className="bg-black text-white px-6 py-2.5 text-sm font-bold rounded-lg hover:bg-gray-800 transition-all active:scale-95 shadow-xl shadow-black/10 hover:shadow-black/20">
                            {t('landing.nav.getStarted')}
                        </button>
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button 
                    className="md:hidden p-2 text-gray-600"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-gray-200 p-6 flex flex-col gap-6 shadow-xl animate-fade-in">
                    <NavLink to="#features" onClick={() => setIsMobileMenuOpen(false)}>{t('landing.nav.platform')}</NavLink>
                    <NavLink to="#ecosystem" onClick={() => setIsMobileMenuOpen(false)}>{t('landing.nav.ecosystem')}</NavLink>
                    <NavLink to="#pricing" onClick={() => setIsMobileMenuOpen(false)}>{t('landing.nav.pricing')}</NavLink>
                    
                    <div className="h-px bg-gray-100 w-full my-2"></div>
                    
                    <div className="flex items-center justify-between">
                        <LanguageMenu />
                    </div>
                    
                    <div className="flex flex-col gap-3">
                        <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center py-3 font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                            {t('landing.nav.logIn')}
                        </Link>
                        <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                            <button className="w-full bg-black text-white py-3 font-bold rounded-lg hover:bg-gray-800 shadow-lg">
                                {t('landing.nav.getStarted')}
                            </button>
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
};
