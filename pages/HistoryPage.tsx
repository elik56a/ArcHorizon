
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useProjectStore } from '../store/useProjectStore';
import { useTranslation } from '../hooks/useTranslation';
import { Card, Button } from '../components/common/UIComponents';
import { Layout, Trash2, ExternalLink, Plus } from 'lucide-react';

const { Link } = ReactRouterDOM as any;

export const HistoryPage: React.FC = () => {
  const { savedSketches, deleteSketch, loadSketch, createNewSketch } = useProjectStore();
  const { t } = useTranslation();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 h-full overflow-y-auto">
       <div className="flex items-end justify-between">
         <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{t('history.title')}</h1>
            <p className="text-gray-500">{t('history.subtitle')}</p>
         </div>
         <Link to="/app/editor" onClick={createNewSketch}>
            <Button icon={<Plus size={16}/>}>{t('dashboard.newProject')}</Button>
         </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedSketches.map((sketch) => (
              <Card key={sketch.id} className="group relative overflow-hidden hover:shadow-md transition-all">
                  {/* Thumbnail Area */}
                  <div className="h-48 bg-gray-50 border-b border-gray-100 flex items-center justify-center relative">
                       <Layout size={64} className="text-gray-200" />
                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                           <Link to="/app/editor" onClick={() => loadSketch(sketch.id)}>
                               <Button variant="secondary" className="shadow-xl">{t('history.openEditor')}</Button>
                           </Link>
                       </div>
                  </div>
                  
                  <div className="p-5">
                      <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-lg text-gray-900 truncate pr-4">{sketch.title}</h3>
                          <button 
                             onClick={() => deleteSketch(sketch.id)}
                             className="text-gray-400 hover:text-red-600 transition-colors"
                             title={t('common.delete')}
                          >
                              <Trash2 size={16} />
                          </button>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2 h-10 mb-4">{sketch.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs font-mono text-gray-400 border-t border-gray-100 pt-3 mt-auto">
                          <span>{sketch.floors} {t('history.floors')}</span>
                          <span>{sketch.totalAreaSqm} {t('common.sqm')}</span>
                          <span className="ml-auto">{new Date().toLocaleDateString()}</span>
                      </div>
                  </div>
              </Card>
          ))}
      </div>
    </div>
  );
};
