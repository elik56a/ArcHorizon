
import React, { useState, useRef } from 'react';
import { SketchData } from '../types';
import { MOCK_THREE_STORY } from '../dev/mockData';
import { useTranslation } from '../hooks/useTranslation';

// Imports from new modular structure
import { Navbar } from '../components/landing/Navbar';
import { HeroSection } from '../components/landing/HeroSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { EcosystemSection } from '../components/landing/EcosystemSection';
import { Footer } from '../components/landing/Footer';

export const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const FIXED_PROMPT = t('landing.hero.inputPlaceholder');

  const [input, setInput] = useState(FIXED_PROMPT);
  const [previewData, setPreviewData] = useState<SketchData>(MOCK_THREE_STORY);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const demoSectionRef = useRef<HTMLDivElement>(null);

  const handleGeneratePreview = async (e: React.FormEvent | React.KeyboardEvent) => {
      e.preventDefault();
      
      setIsGenerating(true);
      setHasGenerated(true); 
      
      setTimeout(() => {
        if (demoSectionRef.current) {
            demoSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);

      // Simulate Generation
      setTimeout(() => {
          setPreviewData(MOCK_THREE_STORY);
          setIsGenerating(false);
      }, 3500); 
  };

  return (
    <div className="h-screen w-full overflow-y-auto bg-white scroll-smooth no-scrollbar selection:bg-black selection:text-white">
      <Navbar />
      
      <HeroSection 
        input={input}
        isGenerating={isGenerating}
        hasGenerated={hasGenerated}
        previewData={previewData}
        onGenerate={handleGeneratePreview}
        demoSectionRef={demoSectionRef}
      />

      <FeaturesSection />
      <EcosystemSection />
      <Footer />
    </div>
  );
};
