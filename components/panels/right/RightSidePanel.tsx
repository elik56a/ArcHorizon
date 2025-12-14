
import React from 'react';
import { useUiStore } from '../../../store/useUiStore';
import { PropertiesPanel } from './PropertiesPanel';
import { LibraryPanel } from './LibraryPanel';
import { GalleryPanel } from './GalleryPanel';

interface RightSidePanelProps {
    disciplineStyle: any;
}

const RightSidePanel: React.FC<RightSidePanelProps> = ({ disciplineStyle }) => {
  const { activeRightPanel } = useUiStore();

  const renderContent = () => {
    switch (activeRightPanel) {
      case 'gallery':
        return <GalleryPanel />;
      case 'properties':
        return <PropertiesPanel disciplineStyle={disciplineStyle} />;
      case 'library':
      default:
        return <LibraryPanel disciplineStyle={disciplineStyle} />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
        {renderContent()}
    </div>
  );
};

export default RightSidePanel;
