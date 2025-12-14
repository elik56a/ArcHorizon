
import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useProjectStore } from '../store/useProjectStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { useTranslation } from '../hooks/useTranslation';
import { Card, Button, Input } from '../components/common/UIComponents';
import { User, Globe, Shield, Check } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuthStore();
  const { unitSystem, setUnitSystem } = useProjectStore();
  const { language, setLanguage } = useLanguageStore();
  const { t } = useTranslation();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 h-full overflow-y-auto">
       <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{t('settings.title')}</h1>
          <p className="text-gray-500">{t('settings.subtitle')}</p>
       </div>

       <div className="space-y-6">
           <Card className="p-6">
               <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                   <User size={20} className="text-blue-600"/> {t('settings.profile')}
               </h2>
               <div className="grid md:grid-cols-2 gap-6">
                   <Input 
                      label={t('settings.displayName')}
                      value={user?.name || ''} 
                      onChange={(e) => updateProfile({ name: e.target.value })} 
                   />
                   <Input 
                      label={t('settings.email')}
                      value={user?.email || ''} 
                      disabled 
                      className="bg-gray-50 cursor-not-allowed"
                   />
               </div>
           </Card>

           <Card className="p-6">
               <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                   <Globe size={20} className="text-blue-600"/> {t('settings.workspace')}
               </h2>
               <div className="space-y-6">
                   {/* Language */}
                   <div>
                       <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 block">{t('settings.language')}</label>
                       <div className="flex gap-3">
                           <button 
                              onClick={() => setLanguage('en')}
                              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${language === 'en' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                           >
                              🇺🇸 English {language === 'en' && <Check size={14} />}
                           </button>
                           <button 
                              onClick={() => setLanguage('he')}
                              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${language === 'he' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                           >
                              🇮🇱 Hebrew (עברית) {language === 'he' && <Check size={14} />}
                           </button>
                       </div>
                   </div>

                   {/* Units */}
                   <div>
                       <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 block">{t('settings.units')}</label>
                       <div className="flex gap-3">
                           <button 
                              onClick={() => setUnitSystem('metric')}
                              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-semibold transition-all ${unitSystem === 'metric' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                           >
                              {t('settings.metric')}
                           </button>
                           <button 
                              onClick={() => setUnitSystem('imperial')}
                              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-semibold transition-all ${unitSystem === 'imperial' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                           >
                              {t('settings.imperial')}
                           </button>
                       </div>
                   </div>
               </div>
           </Card>

           <Card className="p-6">
               <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                   <Shield size={20} className="text-blue-600"/> {t('settings.security')}
               </h2>
               <div className="flex items-center justify-between">
                   <div>
                       <p className="font-bold text-sm">{t('settings.password')}</p>
                       <p className="text-xs text-gray-500">{t('settings.lastChanged')}</p>
                   </div>
                   <Button variant="secondary">{t('settings.changePass')}</Button>
               </div>
           </Card>
           
           <div className="flex justify-end pt-4">
               <Button className="px-8">{t('settings.save')}</Button>
           </div>
       </div>
    </div>
  );
};
