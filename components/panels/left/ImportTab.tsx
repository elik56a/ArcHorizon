
import React, { useState, useRef } from 'react';
import { UploadCloud, FileCode, Image as ImageIcon, X } from 'lucide-react';
import { useProjectStore } from '../../../store/useProjectStore';
import { THEME } from '../../../theme';

export const ImportTab: React.FC = () => {
    const { isGenerating, generateByFile } = useProjectStore();
    const [uploadFiles, setUploadFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) setUploadFiles(prev => [...prev, ...Array.from(e.target.files)]); };
    const handleUploadSubmit = () => { if (uploadFiles.length === 0 || isGenerating) return; uploadFiles.forEach(file => generateByFile(file)); setUploadFiles([]); };

    return (
        <div className="flex-1 p-6 bg-white flex flex-col gap-4 h-full">
            <div 
               className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer h-64 ${isDragging ? 'border-black bg-blue-50' : 'border-gray-300 hover:border-black hover:bg-gray-50'}`} 
               onDragOver={(e) => {e.preventDefault(); setIsDragging(true)}} 
               onDragLeave={() => setIsDragging(false)} 
               onDrop={(e) => {e.preventDefault(); setIsDragging(false); if(e.dataTransfer.files) setUploadFiles(p => [...p, ...Array.from(e.dataTransfer.files)])}} 
               onClick={() => fileInputRef.current?.click()}
            >
               <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple accept="image/*,application/pdf,.dxf" />
               <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-600">
                  <UploadCloud size={24} />
               </div>
               <p className="text-sm font-bold text-gray-900">Click or drag files to upload</p>
               <p className="text-xs text-gray-500 mt-1">Supports DXF, PDF, JPG, PNG</p>
            </div>
            
            {uploadFiles.length > 0 && (
                <div className="flex-1 overflow-y-auto space-y-2 border-t border-gray-100 pt-4">
                   <label className={THEME.label}>Ready to Process</label>
                   {uploadFiles.map((file, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center gap-3">
                          <div className="w-8 h-8 bg-white rounded flex items-center justify-center border border-gray-200 text-blue-600">
                            {file.name.endsWith('.dxf') ? <FileCode size={16}/> : <ImageIcon size={16}/>}
                          </div>
                          <div className="flex-1 min-w-0">
                             <p className="text-xs font-bold truncate text-gray-800">{file.name}</p>
                             <p className="text-[10px] text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
                          </div>
                          <button onClick={() => setUploadFiles(p => p.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500 transition-colors"><X size={16}/></button>
                      </div>
                   ))}
                </div>
            )}
            
            <div className="mt-auto">
                <button onClick={handleUploadSubmit} disabled={uploadFiles.length === 0 || isGenerating} className={THEME.buttonPrimary + " w-full py-3"}>
                     Convert to Blueprint
                </button>
            </div>
         </div>
    );
};
