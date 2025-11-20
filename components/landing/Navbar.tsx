import React from 'react';
import { Link } from 'react-router-dom';

const NavLink = ({ to, children }: { to: string, children: React.ReactNode }) => (
    <Link to={to} className="text-sm font-bold text-gray-500 hover:text-black transition-colors font-mono uppercase tracking-tight">
        {children}
    </Link>
);

export const Navbar: React.FC = () => {
    return (
        <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-xl border-b border-gray-100 z-50 transition-all">
            <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo(0,0)}>
                <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-bold font-mono text-xl rounded-lg shadow-lg group-hover:rotate-90 transition-transform duration-500">A</div>
                <span className="font-bold text-xl tracking-tight">ArcHorizon</span>
                </div>
                
                <div className="hidden md:flex items-center gap-10">
                    <NavLink to="#features">Platform</NavLink>
                    <NavLink to="#ecosystem">Ecosystem</NavLink>
                    <NavLink to="#pricing">Pricing</NavLink>
                </div>

                <div className="flex items-center gap-6">
                <Link to="/login" className="text-sm font-bold text-gray-600 hover:text-black transition-colors">Log In</Link>
                <Link to="/signup">
                    <button className="bg-black text-white px-6 py-2.5 text-sm font-bold rounded-lg hover:bg-gray-800 transition-all active:scale-95 shadow-xl shadow-black/10 hover:shadow-black/20">
                        Get Started
                    </button>
                </Link>
                </div>
            </div>
        </nav>
    );
};