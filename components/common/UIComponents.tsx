
import React from 'react';
import { Loader2 } from 'lucide-react';

// --- BUTTONS ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', isLoading, icon, className = '', disabled, ...props }) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-sans font-semibold text-sm transition-all active:scale-95 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-black text-white border border-black hover:bg-gray-800 focus:ring-gray-900",
    secondary: "bg-white text-black border border-gray-200 hover:border-black hover:bg-gray-50 focus:ring-gray-200",
    ghost: "bg-transparent text-gray-600 hover:text-black hover:bg-gray-100 focus:ring-gray-200",
    danger: "bg-white text-red-600 border border-red-200 hover:bg-red-50 focus:ring-red-200"
  };

  const sizeStyles = "py-2.5 px-4";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizeStyles} ${className}`} 
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!isLoading && icon}
      {children}
    </button>
  );
};

// --- INPUTS ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">{label}</label>}
      <input 
        className={`w-full bg-white border border-gray-300 p-2.5 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all rounded-md placeholder:text-gray-400 ${className}`}
        {...props} 
      />
    </div>
  );
};

// --- CARDS ---
export const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}>
      {children}
    </div>
  );
};
