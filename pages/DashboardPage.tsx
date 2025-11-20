
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useProjectStore } from '../store/useProjectStore';
import { Card, Button } from '../components/common/UIComponents';
import { Plus, FileCode, Clock, ArrowUpRight, Layout } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { savedSketches, createNewSketch, loadSketch } = useProjectStore();

  const stats = [
    { label: 'Total Projects', value: savedSketches.length, icon: Layout },
    { label: 'Last Edited', value: '2h ago', icon: Clock },
    { label: 'Plan Status', value: user?.plan, icon: FileCode },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-end justify-between">
         <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
            <p className="text-gray-500">Welcome back, {user?.name}. Here's what's happening.</p>
         </div>
         <Link to="/app/editor" onClick={createNewSketch}>
            <Button icon={<Plus size={16}/>}>New Project</Button>
         </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {stats.map((stat, i) => (
             <Card key={i} className="p-6 flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                    <stat.icon size={24} />
                 </div>
                 <div>
                    <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                 </div>
             </Card>
         ))}
      </div>

      {/* Recent Projects */}
      <div>
         <div className="flex items-center justify-between mb-4">
             <h2 className="text-lg font-bold">Recent Projects</h2>
             <Link to="/app/history" className="text-sm font-medium text-blue-600 hover:text-black flex items-center gap-1">
                View All <ArrowUpRight size={14} />
             </Link>
         </div>
         
         {savedSketches.length === 0 ? (
             <Card className="p-12 text-center flex flex-col items-center justify-center border-dashed">
                 <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <Layout size={32} />
                 </div>
                 <h3 className="font-bold text-lg text-gray-900">No projects yet</h3>
                 <p className="text-gray-500 mb-6 max-w-xs">Start your first architectural masterpiece today.</p>
                 <Link to="/app/editor" onClick={createNewSketch}>
                    <Button>Create Project</Button>
                 </Link>
             </Card>
         ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {savedSketches.slice(0, 3).map((sketch) => (
                     <Link to="/app/editor" key={sketch.id} onClick={() => loadSketch(sketch.id)}>
                        <Card className="group cursor-pointer overflow-hidden hover:border-black transition-all">
                           <div className="h-40 bg-gray-100 relative flex items-center justify-center">
                              {/* Placeholder Thumbnail */}
                              <Layout size={48} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                           </div>
                           <div className="p-4">
                              <h3 className="font-bold text-gray-900 truncate">{sketch.title}</h3>
                              <p className="text-xs text-gray-500 mt-1">{sketch.rooms.length} Rooms • {sketch.totalAreaSqm} m²</p>
                           </div>
                        </Card>
                     </Link>
                 ))}
             </div>
         )}
      </div>
    </div>
  );
};
