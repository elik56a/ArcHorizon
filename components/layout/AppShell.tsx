
import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../Logo';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  LayoutDashboard, PenTool, History, Settings, 
  LogOut, ChevronRight, User as UserIcon
} from 'lucide-react';

export const AppShell: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  // If on editor page, we might want a more condensed layout, 
  // but for now we keep the persistent sidebar for SaaS feel.
  
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
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 z-50">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
           <div className="w-6 h-6 mr-3"><Logo /></div>
           <span className="font-bold text-lg tracking-tight">ArcHorizon</span>
        </div>

        <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
           {navItems.map((item) => {
             const isActive = location.pathname.startsWith(item.to);
             return (
               <NavLink 
                 key={item.to} 
                 to={item.to}
                 className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group
                    ${isActive ? 'bg-black text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                 `}
               >
                 <item.icon size={18} />
                 {item.label}
                 {isActive && <ChevronRight size={14} className="ml-auto opacity-50" />}
               </NavLink>
             );
           })}
        </div>

        <div className="p-4 border-t border-gray-100">
           <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer mb-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
                 {user?.avatar ? <img src={user.avatar} alt="user" /> : <UserIcon size={20} className="m-1.5 text-gray-500"/>}
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                 <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
           </div>
           <button 
             onClick={handleLogout}
             className="w-full flex items-center justify-center gap-2 text-xs font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 py-2 rounded-md transition-colors"
           >
             <LogOut size={14} /> Sign Out
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
