import React, { useState, useEffect } from 'react';
import { Compass, X } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { RotatingHouse } from '../landing/RotatingHouse';
import { LOADING_STEPS } from './constants';

const OVERTIME_STEPS = [
    "FINALIZING GEOMETRY...",
    "OPTIMIZING LAYOUT...",
    "POLISHING ASSETS...",
    "ALMOST READY...",
    "PREPARING VIEWPORT..."
];

export const LoadingOverlay: React.FC = () => {
    const [stepIndex, setStepIndex] = useState(0);
    const [isOvertime, setIsOvertime] = useState(false);
    const [overtimeIndex, setOvertimeIndex] = useState(0);
    
    useEffect(() => {
        // Slow interval: 5 seconds per step to match realistic LLM processing time
        const durationPerStep = 5000; 
        
        const interval = setInterval(() => {
            setStepIndex(prev => {
                // If we haven't reached the end of the main list, advance
                if (prev < LOADING_STEPS.length - 1) {
                    return prev + 1;
                } 
                // If we reached the end, switch to overtime mode
                else {
                    setIsOvertime(true);
                    setOvertimeIndex(ov => (ov + 1) % OVERTIME_STEPS.length);
                    return prev; // Stay at max index for progress bar calculation
                }
            });
        }, durationPerStep);

        return () => clearInterval(interval);
    }, []);

    // Progress Logic:
    // Normal: 0 to 90% based on steps.
    // Overtime: Pulse between 90% and 98%.
    let progress = 0;
    if (!isOvertime) {
        progress = Math.min(90, Math.round(((stepIndex + 1) / LOADING_STEPS.length) * 90));
    } else {
        progress = 95; // Fixed high percentage for overtime
    }

    const currentText = isOvertime ? OVERTIME_STEPS[overtimeIndex] : LOADING_STEPS[stepIndex];

    return (
        <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center select-none animate-fade-in pointer-events-none">
            <div className="relative z-10 bg-white p-10 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] flex flex-col items-center max-w-md w-full pointer-events-auto transition-all duration-500 rounded-xl">
                <div className="w-48 h-48 mb-6">
                    <Canvas camera={{ position: [4, 3, 4], fov: 45 }}>
                         <ambientLight intensity={0.8} />
                         <directionalLight position={[2, 5, 2]} />
                         <RotatingHouse />
                         <Environment preset="city" />
                    </Canvas>
                </div>
                
                <h3 className="text-xl font-black font-mono uppercase tracking-tighter mb-4">GENERATING BLUEPRINT</h3>
                
                {/* Progress Bar Container */}
                <div className="w-full h-3 bg-gray-100 border border-black mb-2 overflow-hidden relative rounded-full">
                    {/* Actual filling bar */}
                    <div 
                        className={`absolute top-0 bottom-0 left-0 bg-black transition-all ease-out ${isOvertime ? 'duration-[2000ms] animate-pulse' : 'duration-[6000ms]'}`}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                
                <div className="flex justify-between w-full text-xs font-mono font-bold text-gray-500 mt-2">
                    <span className="uppercase animate-pulse transition-all duration-300 min-w-[200px]">{currentText}</span>
                    <span>{progress}%</span>
                </div>
            </div>
        </div>
    );
};

export const EmptyState: React.FC = () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 p-10 select-none">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        <div className="max-w-lg w-full text-center space-y-8 opacity-80">
            <div className="relative w-64 h-64 mx-auto border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center">
                <Compass size={64} strokeWidth={1} className="text-black mb-4" />
                <span className="font-mono font-bold text-sm uppercase tracking-widest text-gray-500">No Schematic Data</span>
            </div>
            <div className="space-y-2">
                <h2 className="text-3xl font-black text-black tracking-tighter uppercase font-mono">Awaiting Input</h2>
                <p className="text-gray-500 font-mono text-xs uppercase tracking-wide">Use the Command Terminal or Spec Sheet to initialize project.</p>
            </div>
        </div>
    </div>
);

export const RenderSuccessToast: React.FC<{ url: string | null, onClose: () => void, onViewGallery: () => void }> = ({ url, onClose, onViewGallery }) => {
    if (!url) return null;
    return (
        <div className="absolute top-24 right-6 z-40 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 flex items-center gap-4 animate-slide-up max-w-sm rounded-lg">
            <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200 overflow-hidden shrink-0">
                <img src={url} alt="Render Thumbnail" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-sm">Render Complete!</h4>
                <p className="text-xs text-gray-500 mb-2">Image saved to gallery.</p>
                <div className="flex gap-2">
                    <button onClick={onViewGallery} className="text-[10px] font-bold underline text-blue-600">Open Gallery</button>
                    <button onClick={onClose} className="text-[10px] font-bold underline text-gray-500 hover:text-black">Dismiss</button>
                </div>
            </div>
            <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-black"><X size={12}/></button>
        </div>
    );
};