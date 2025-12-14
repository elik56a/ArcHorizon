
import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Logo } from '../Logo';
import { useAuthStore } from '../../store/useAuthStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useTranslation } from '../../hooks/useTranslation';
import { 
  LayoutDashboard, PenTool, History, Settings, 
  LogOut, ChevronRight, User as UserIcon, ChevronLeft, Menu, X
} from 'lucide-react';

const { NavLink, Outlet, useLocation, useNavigate } = ReactRouterDOM as any;

export const AppShell: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { dir } = useLanguageStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Desktop collapse state
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Mobile drawer state
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const navItems = [
    { to: '/app/dashboard', icon: LayoutDashboard, label: t('dashboard.title') }, 
    { to: '/app/editor', icon: PenTool, label: t('landing.nav.editor') }, 
    { to: '/app/history', icon: History, label: t('history.title') },
    { to: '/app/settings', icon: Settings, label: t('settings.title') },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden" dir={dir}>
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center px-4 justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8"><Logo /></div>
             <span className="font-bold text-lg tracking-tight">ArcHorizon</span>
          </div>
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
             <Menu size={24} />
          </button>
      </div>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-50 md:hidden animate-fade-in"
            onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
            fixed md:static inset-y-0 left-0 z-50 bg-white border-e border-gray-200 flex flex-col transition-all duration-300 ease-in-out shadow-2xl md:shadow-none
            ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
            ${isCollapsed ? 'md:w-20' : 'md:w-64'}
        `}
      >
        <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-6'} border-b border-gray-100 transition-all relative shrink-0`}>
           <div className="w-6 h-6 shrink-0"><Logo /></div>
           {!isCollapsed && <span className="font-bold text-lg tracking-tight ms-3 whitespace-nowrap overflow-hidden">ArcHorizon</span>}
           
           {/* Desktop Toggle Button */}
           <button 
             onClick={() => setIsCollapsed(!isCollapsed)}
             className={`absolute -right-3 rtl:right-auto rtl:-left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-gray-200 rounded-full hidden md:flex items-center justify-center text-gray-400 hover:text-black shadow-sm hover:shadow-md transition-all z-50 ${isCollapsed ? 'rotate-180 rtl:rotate-0' : 'rtl:rotate-180'}`}
           >
             <ChevronLeft size={12} />
           </button>

           {/* Mobile Close Button */}
           <button 
             onClick={() => setIsMobileOpen(false)}
             className="md:hidden absolute right-4 text-gray-400 hover:text-black"
           >
             <X size={20} />
           </button>
        </div>

        <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
           {navItems.map((item) => {
             const isActive = location.pathname.startsWith(item.to);
             return (
               <NavLink 
                 key={item.to} 
                 to={item.to}
                 title={isCollapsed ? item.label : ''}
                 className={({ isActive }: any) => `
                    flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3 gap-3'} py-2.5 rounded-lg text-sm font-medium transition-all group
                    ${isActive ? 'bg-black text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                 `}
               >
                 <item.icon size={18} className="shrink-0" />
                 {!isCollapsed && <span>{item.label}</span>}
                 {!isCollapsed && isActive && <ChevronRight size={14} className="ms-auto opacity-50 rtl:rotate-180" />}
               </NavLink>
             );
           })}
        </div>

        <div className="p-4 border-t border-gray-100">
           <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer mb-2`}>
              <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-300 shrink-0">
                 {user?.avatar ? <img src={user.avatar} alt="user" /> : <UserIcon size={20} className="m-1.5 text-gray-500"/>}
              </div>
              {!isCollapsed && (
                  <div className="flex-1 min-w-0 overflow-hidden text-start">
                     <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                     <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
              )}
           </div>
           <button 
             onClick={handleLogout}
             title={isCollapsed ? 'Sign Out' : ''}
             className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-center gap-2'} text-xs font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 py-2 rounded-md transition-colors`}
           >
             <LogOut size={14} className="shrink-0 rtl:rotate-180" /> 
             {!isCollapsed && t('landing.nav.logIn')}
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative pt-16 md:pt-0">
         <Outlet />
      </main>
    </div>
  );
};
