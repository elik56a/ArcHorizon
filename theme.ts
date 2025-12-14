
import { PencilRuler, Droplets, Zap, Fan, Flame } from 'lucide-react';

export const THEME = {
  // Layout
  panelBorder: "border-r border-gray-200",
  panelBorderLeft: "border-l border-gray-200",
  
  // Components
  buttonPrimary: "bg-black text-white border border-black font-sans font-semibold text-sm py-2 px-4 hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-md",
  buttonSecondary: "bg-white text-black border border-gray-200 font-sans font-semibold text-sm py-2 px-4 hover:border-black hover:bg-gray-50 transition-all active:scale-95 rounded-md",
  buttonGhost: "bg-transparent text-gray-600 hover:text-black font-sans font-medium text-sm hover:bg-gray-100 px-3 py-1 rounded-md transition-colors",
  
  // Inputs
  input: "w-full bg-white border border-gray-300 p-2.5 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all rounded-md placeholder:text-gray-400",
  select: "w-full bg-white border border-gray-300 p-2.5 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all rounded-md appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-no-repeat bg-[right_0.5rem_center]",

  // Typography
  header: "font-sans font-bold tracking-tight text-gray-900",
  label: "font-sans text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 block",
  
  // Containers
  card: "bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow",
  sectionHeader: "bg-gray-50/50 border-b border-gray-200 p-3 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors rounded-t-lg",
  
  // Colors
  colors: {
    black: '#111827',
    white: '#ffffff',
    gray: '#f3f4f6',
    accent: '#2563eb',
  }
};

export const DISCIPLINE_STYLES = {
    arc: { 
        label: 'Architecture', 
        icon: PencilRuler, 
        color: '#0f172a', // Slate 900
        bg: 'bg-slate-50', 
        border: 'border-slate-200', 
        activeBorder: 'border-slate-900', 
        text: 'text-slate-900', 
        highlight: 'bg-slate-900',
        light: 'bg-slate-100',
        selection: '#0f172a'
    },
    plumbing: { 
        label: 'Plumbing', 
        icon: Droplets, 
        color: '#0891b2', // Cyan 600
        bg: 'bg-cyan-50', 
        border: 'border-cyan-200', 
        activeBorder: 'border-cyan-600', 
        text: 'text-cyan-700', 
        highlight: 'bg-cyan-600',
        light: 'bg-cyan-100',
        selection: '#0891b2'
    },
    elec: { 
        label: 'Electrical', 
        icon: Zap, 
        color: '#d97706', // Amber 600
        bg: 'bg-amber-50', 
        border: 'border-amber-200', 
        activeBorder: 'border-amber-500', 
        text: 'text-amber-700', 
        highlight: 'bg-amber-500',
        light: 'bg-amber-100',
        selection: '#d97706'
    },
    hvac: { 
        label: 'HVAC', 
        icon: Fan, 
        color: '#059669', // Emerald 600
        bg: 'bg-emerald-50', 
        border: 'border-emerald-200', 
        activeBorder: 'border-emerald-600', 
        text: 'text-emerald-700', 
        highlight: 'bg-emerald-600',
        light: 'bg-emerald-100',
        selection: '#059669'
    },
    fire: { 
        label: 'Fire Safety', 
        icon: Flame, 
        color: '#dc2626', // Red 600
        bg: 'bg-red-50', 
        border: 'border-red-200', 
        activeBorder: 'border-red-600', 
        text: 'text-red-700', 
        highlight: 'bg-red-600',
        light: 'bg-red-100',
        selection: '#dc2626'
    },
} as const;
