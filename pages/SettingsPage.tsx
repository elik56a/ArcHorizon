
import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useProjectStore } from '../store/useProjectStore';
import { Card, Button, Input } from '../components/common/UIComponents';
import { User, Globe, Shield } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuthStore();
  const { unitSystem, setUnitSystem } = useProjectStore();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 h-full overflow-y-auto">
       <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
          <p className="text-gray-500">Manage your account preferences and workspace settings.</p>
       </div>

       <div className="space-y-6">
           <Card className="p-6">
               <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                   <User size={20} className="text-blue-600"/> Profile Information
               </h2>
               <div className="grid md:grid-cols-2 gap-6">
                   <Input 
                      label="Display Name" 
                      value={user?.name || ''} 
                      onChange={(e) => updateProfile({ name: e.target.value })} 
                   />
                   <Input 
                      label="Email Address" 
                      value={user?.email || ''} 
                      disabled 
                      className="bg-gray-50 cursor-not-allowed"
                   />
               </div>
           </Card>

           <Card className="p-6">
               <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                   <Globe size={20} className="text-blue-600"/> Workspace Preferences
               </h2>
               <div className="space-y-4">
                   <div>
                       <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 block">Measurement Unit System</label>
                       <div className="flex gap-3">
                           <button 
                              onClick={() => setUnitSystem('metric')}
                              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-semibold transition-all ${unitSystem === 'metric' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                           >
                              Metric (Meters)
                           </button>
                           <button 
                              onClick={() => setUnitSystem('imperial')}
                              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-semibold transition-all ${unitSystem === 'imperial' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                           >
                              Imperial (Feet)
                           </button>
                       </div>
                   </div>
               </div>
           </Card>

           <Card className="p-6">
               <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                   <Shield size={20} className="text-blue-600"/> Security
               </h2>
               <div className="flex items-center justify-between">
                   <div>
                       <p className="font-bold text-sm">Password</p>
                       <p className="text-xs text-gray-500">Last changed 3 months ago</p>
                   </div>
                   <Button variant="secondary">Change Password</Button>
               </div>
           </Card>
           
           <div className="flex justify-end pt-4">
               <Button className="px-8">Save Changes</Button>
           </div>
       </div>
    </div>
  );
};
