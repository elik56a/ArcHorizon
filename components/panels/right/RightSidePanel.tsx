
import React from 'react';
import { useUiStore } from '../../../store/useUiStore';
import { PropertiesPanel } from './PropertiesPanel';
import { LibraryPanel } from './LibraryPanel';
import { GalleryPanel } from './GalleryPanel';

const RightSidePanel: React.FC = () => {
  const { activeRightPanel } = useUiStore();

  const renderContent = () => {
    switch (activeRightPanel) {
      case 'gallery':
        return <GalleryPanel />;
      case 'properties':
        return <PropertiesPanel />;
      case 'library':
      default:
        return <LibraryPanel />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
        {renderContent()}
    </div>
  );
};

export default RightSidePanel;
