import { useState, useRef, useEffect } from "react";
import { useGlassTheme } from "../hooks/useGlassTheme";

interface GlassSelectProps {
  value: string | number;
  onChange: (value: any) => void;
  options: { label: string; value: string | number }[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function GlassSelect({ value, onChange, options, placeholder = "Chọn...", className = "", disabled = false }: GlassSelectProps) {
  const isGlass = useGlassTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const baseClass = isGlass 
    ? "glass-input bg-white/10 border-white/20 text-white" 
    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white";
    
  const dropdownClass = isGlass
    ? "glass-dropdown"
    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl";

  const itemHoverClass = isGlass
    ? "hover:bg-white/10"
    : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200";

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        className={`w-full px-4 py-3 rounded-2xl flex items-center justify-between font-medium outline-none transition-all ${baseClass} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-white/40'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className={`absolute z-50 w-full mt-2 rounded-[1.5rem] overflow-hidden p-1 animate-slide-up origin-top ${dropdownClass}`}>
          <ul className="max-h-60 overflow-y-auto custom-scrollbar">
            {options.map((option) => (
              <li
                key={String(option.value)}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`px-4 py-3 rounded-xl cursor-pointer text-sm font-semibold transition-all flex items-center justify-between ${itemHoverClass} ${String(value) === String(option.value) ? (isGlass ? 'bg-white/20 text-white' : 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400') : (isGlass ? 'text-white' : '')}`}
              >
                {option.label}
                {String(value) === String(option.value) && (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </li>
            ))}
            {options.length === 0 && (
              <li className={`px-4 py-3 text-sm text-center italic ${isGlass ? 'text-white drop-shadow-md' : 'text-slate-500'}`}>
                Không có dữ liệu
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
