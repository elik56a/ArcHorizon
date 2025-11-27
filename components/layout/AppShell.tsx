import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../Logo';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  LayoutDashboard, PenTool, History, Settings, 
  LogOut, ChevronRight, User as UserIcon, Menu, ChevronLeft
} from 'lucide-react';

export const AppShell: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const navItems = [
    { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/app/editor', icon: PenTool, label: 'Editor' },
    { to: '/app/history', icon: History, label: 'Projects' },
    { to: '/app/settings', icon: Settings, label: 'Settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`bg-white border-r border-gray-200 flex flex-col shrink-0 z-50 transition-all duration-300 ease-in-out ${
            isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-6'} border-b border-gray-100 transition-all relative`}>
           <div className="w-6 h-6"><Logo /></div>
           {!isCollapsed && <span className="font-bold text-lg tracking-tight ml-3 whitespace-nowrap overflow-hidden">ArcHorizon</span>}
           
           {/* Toggle Button */}
           <button 
             onClick={() => setIsCollapsed(!isCollapsed)}
             className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-black shadow-sm hover:shadow-md transition-all z-50 ${isCollapsed ? 'rotate-180' : ''}`}
           >
             <ChevronLeft size={12} />
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
                 className={({ isActive }) => `
                    flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3 gap-3'} py-2.5 rounded-lg text-sm font-medium transition-all group
                    ${isActive ? 'bg-black text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                 `}
               >
                 <item.icon size={18} />
                 {!isCollapsed && <span>{item.label}</span>}
                 {!isCollapsed && isActive && <ChevronRight size={14} className="ml-auto opacity-50" />}
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
                  <div className="flex-1 min-w-0 overflow-hidden">
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
             <LogOut size={14} /> 
             {!isCollapsed && "Sign Out"}
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
         <Outlet />
      </main>
    </div>
  );
};