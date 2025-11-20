
import React from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { PropertiesPanel } from './panels/right/PropertiesPanel';
import { LibraryPanel } from './panels/right/LibraryPanel';

const RightSidePanel: React.FC = () => {
  const { selection } = useProjectStore();

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
        {selection ? <PropertiesPanel /> : <LibraryPanel />}
    </div>
  );
};

export default RightSidePanel;
