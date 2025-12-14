
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useProjectStore } from '../store/useProjectStore';
import { useTranslation } from '../hooks/useTranslation';
import { Card, Button } from '../components/common/UIComponents';
import { ProjectThumbnail } from '../components/common/ProjectThumbnail';
import { Plus, FileCode, Clock, ArrowUpRight, Layout, Activity, Database, ChevronRight, TrendingUp, MoreHorizontal } from 'lucide-react';

const { Link } = ReactRouterDOM as any;

const ActivityGraph = () => {
  const points = [20, 45, 30, 60, 55, 85, 70, 90, 65, 100];
  const max = Math.max(...points);
  const width = 300;
  const height = 60;
  const stepX = width / (points.length - 1);

  const pathD = points.map((p, i) => {
    const x = i * stepX;
    const y = height - (p / max) * height;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const fillPath = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  return (
    <div className="w-full h-24 relative overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
         <defs>
           <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
             <stop offset="0%" style={{ stopColor: '#2563eb', stopOpacity: 0.2 }} />
             <stop offset="100%" style={{ stopColor: '#2563eb', stopOpacity: 0 }} />
           </linearGradient>
         </defs>
         <path d={fillPath} fill="url(#grad)" />
         <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { savedSketches, createNewSketch, loadSketch } = useProjectStore();
  const { t } = useTranslation();

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 h-full overflow-y-auto bg-gray-50/50">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
         <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2 text-gray-900">{t('dashboard.title')}</h1>
            <p className="text-gray-500 font-medium text-sm md:text-base">
                {t('dashboard.welcome', { name: user?.name || 'Architect' })} <span className="text-black font-bold">{t('dashboard.activeProjects', { count: savedSketches.length })}</span>.
            </p>
         </div>
         <div className="flex gap-3 w-full md:w-auto">
            <Button variant="secondary" className="flex-1 md:flex-none">{t('dashboard.viewReports')}</Button>
            <Link to="/app/editor" onClick={createNewSketch} className="flex-1 md:flex-none">
                <Button icon={<Plus size={16}/>} className="w-full">{t('dashboard.newProject')}</Button>
            </Link>
         </div>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Card 1: Project Velocity */}
         <Card className="p-0 overflow-hidden border-none shadow-sm ring-1 ring-gray-200">
             <div className="p-6 pb-2 flex justify-between items-start">
                <div>
                    <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">{t('dashboard.velocity.title')}</p>
                    <h3 className="text-2xl font-black text-gray-900">+24%</h3>
                </div>
                <div className="w-8 h-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                    <TrendingUp size={16} />
                </div>
             </div>
             <div className="px-6 pb-4">
                <p className="text-xs text-gray-500">{t('dashboard.velocity.desc')}</p>
             </div>
             <ActivityGraph />
         </Card>

         {/* Card 2: Storage/Plan */}
         <Card className="p-6 border-none shadow-sm ring-1 ring-gray-200 flex flex-col justify-between">
             <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">{t('dashboard.storage.title')}</p>
                    <h3 className="text-2xl font-black text-gray-900">{t('dashboard.storage.used', { percent: 45 })}</h3>
                </div>
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <Database size={16} />
                </div>
             </div>
             
             <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
                 <div className="bg-black h-full rounded-full" style={{ width: '45%' }}></div>
             </div>
             <p className="text-xs text-gray-500 flex justify-between">
                 <span>{t('dashboard.storage.details', { used: 2.4, total: 5 })}</span>
                 <span className="text-blue-600 font-bold cursor-pointer hover:underline">{t('dashboard.storage.upgrade')}</span>
             </p>
         </Card>

         {/* Card 3: Quick Stats */}
         <Card className="p-6 border-none shadow-sm ring-1 ring-gray-200 flex flex-col justify-between">
             <div>
                <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-4">{t('dashboard.status.title')}</p>
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-gray-600"><Activity size={14} className="text-green-500"/> {t('dashboard.status.ai')}</span>
                        <span className="font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs">{t('dashboard.status.online')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-gray-600"><FileCode size={14} className="text-gray-400"/> {t('dashboard.status.dxf')}</span>
                        <span className="font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{t('dashboard.status.ready')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-gray-600"><Layout size={14} className="text-gray-400"/> {t('dashboard.status.library')}</span>
                        <span className="font-bold text-gray-900">v1.5.0</span>
                    </div>
                </div>
             </div>
         </Card>
      </div>

      {/* Recent Projects Section */}
      <div>
         <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
                 <h2 className="text-lg font-bold">{t('dashboard.recent.title')}</h2>
                 <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-bold">{savedSketches.length}</span>
             </div>
             <Link to="/app/history" className="text-sm font-bold text-gray-500 hover:text-black flex items-center gap-1 transition-colors">
                {t('dashboard.recent.viewAll')} <ChevronRight size={14} />
             </Link>
         </div>
         
         {savedSketches.length === 0 ? (
             <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 flex flex-col items-center justify-center text-center bg-white">
                 <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <Layout size={32} />
                 </div>
                 <h3 className="font-bold text-lg text-gray-900 mb-2">{t('dashboard.recent.noProjects')}</h3>
                 <p className="text-gray-500 mb-6 max-w-xs text-sm">{t('dashboard.recent.noProjectsDesc')}</p>
                 <Link to="/app/editor" onClick={createNewSketch}>
                    <Button>{t('dashboard.recent.startNew')}</Button>
                 </Link>
             </div>
         ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {savedSketches.slice(0, 4).map((sketch) => (
                     <Link to="/app/editor" key={sketch.id} onClick={() => loadSketch(sketch.id)} className="group">
                        <Card className="h-full hover:shadow-md transition-all border-gray-200 group-hover:border-gray-300 cursor-pointer overflow-hidden flex flex-col">
                           {/* Thumbnail */}
                           <ProjectThumbnail data={sketch} className="aspect-[4/3] border-b border-gray-100 group-hover:opacity-90 transition-opacity" />
                           
                           {/* Content */}
                           <div className="p-4 flex-1 flex flex-col">
                              <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-bold text-gray-900 truncate pr-2 group-hover:text-blue-600 transition-colors">{sketch.title}</h3>
                              </div>
                              <p className="text-xs text-gray-500 line-clamp-2 mb-4">{sketch.description || 'No description'}</p>
                              
                              <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] font-mono uppercase text-gray-400 tracking-wide">
                                  <div className="flex items-center gap-2">
                                      <Clock size={12} />
                                      <span>{t('dashboard.recent.ago', { time: '2h' })}</span>
                                  </div>
                                  <div className="font-bold text-gray-600">{sketch.totalAreaSqm} {t('common.sqm')}</div>
                              </div>
                           </div>
                        </Card>
                     </Link>
                 ))}
                 
                 {/* Add New Card */}
                 <Link to="/app/editor" onClick={createNewSketch} className="group">
                     <div className="h-full min-h-[280px] border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center hover:border-gray-400 hover:bg-gray-50 transition-all cursor-pointer p-6">
                         <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                             <Plus size={24} />
                         </div>
                         <h3 className="font-bold text-gray-900">{t('dashboard.recent.createNewCard')}</h3>
                         <p className="text-xs text-gray-500 mt-1">{t('dashboard.recent.scratch')}</p>
                     </div>
                 </Link>
             </div>
         )}
      </div>
    </div>
  );
};
